import { Match, MatchDetail } from './interfaces.js';
import { ApiFootballComAdapter } from './providers/api-football/adapter.js';
import { matchRepository } from '../repositories/matchRepository.js';
import { leagueService } from './leagueService.js';
import { auditService } from './auditService.js';
import { syncStatusRepository } from '../repositories/syncStatusRepository.js';

export class FootballService {
  private apiFootball: ApiFootballComAdapter;

  constructor(apiFootball?: ApiFootballComAdapter) {
    this.apiFootball = apiFootball || new ApiFootballComAdapter();
  }

  private async configureAdapter() {
    try {
      const allowedLeagues = await leagueService.getAllowedLeagues();
      let afIds: number[] = [];

      if (allowedLeagues.length === 0) {
          console.warn('[FootballService] No allowed leagues found in DB. Using defaults.');
          afIds = [39, 2, 140, 61]; // PL, CL, PD, FL1
      } else {
          afIds = allowedLeagues.map(l => l.api_football_id).filter(id => id);
      }
      
      this.apiFootball.setAllowedLeagues(afIds);
    } catch (e) {
      console.error('[FootballService] Error configuring adapter:', e);
    }
  }

  async getMatches(dateStr?: string): Promise<Match[]> {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    auditService.log('getMatches', `Fetching matches for ${date}`);

    try {
        // 1. Fetch from DB (Cache First Strategy)
        let matches = await matchRepository.getMatchesByDate(date);

        // SELF-HEALING: Remove old provider data
        // If we find matches from 'football-data', we must delete them to avoid duplicates/stale data
        const oldProviderMatches = matches.filter(m => m.provider === 'football-data');
        if (oldProviderMatches.length > 0) {
            console.log(`[FootballService] Found ${oldProviderMatches.length} matches from old provider. Deleting...`);
            for (const m of oldProviderMatches) {
                await matchRepository.deleteMatch(m.id);
            }
            matches = matches.filter(m => m.provider !== 'football-data');
        }

        // 2. If it's NOT today, return DB result (Historical/Future should be synced via Cron)
        if (date !== today) {
             return matches;
        }

        // 3. Today's Matches Logic (On-Demand Sync)
        await this.configureAdapter();

        // Check if we need to sync live matches
        // Conditions:
        // a) DB has matches that are LIVE or STARTING SOON
        // b) OR DB is empty (first load of the day if cron failed)
        // c) AND Rate limit allows it
        
        const now = new Date();
        const twentyMinsFromNow = new Date(now.getTime() + 20 * 60000);
        
        const hasActiveMatches = matches.some(m => {
            const matchDate = new Date(m.utcDate);
            const isLive = ['IN_PLAY', 'PAUSED', 'HALFTIME', 'LIVE', '1H', '2H', 'ET', 'P', 'BT', 'INT'].includes(m.status);
            const isStartingSoon = m.status === 'SCHEDULED' && matchDate <= twentyMinsFromNow;
            return isLive || isStartingSoon;
        });

        // Check if synced recently
        const lastSync = await auditService.getLastSyncTime('syncLiveMatches');
        const minIntervalMs = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastSync = lastSync ? (now.getTime() - lastSync.getTime()) : Infinity;

        // If DB is empty, we force sync regardless of active matches (to populate the day)
        // If DB has matches, we only sync if there are active matches
        const shouldSync = (matches.length === 0 || hasActiveMatches) && timeSinceLastSync > minIntervalMs;

        if (shouldSync) {
             console.log(`[FootballService] On-demand sync triggered. Last sync was ${(timeSinceLastSync / 60000).toFixed(1)} mins ago.`);
             
             // Trigger Sync
             await this.syncLiveMatches(); // This updates DB
             
             // Reload from DB
             matches = await matchRepository.getMatchesByDate(date);
        } else {
             if (hasActiveMatches) {
                 console.log(`[FootballService] Skipping sync (Rate Limit). Last sync: ${(timeSinceLastSync / 60000).toFixed(1)}m ago.`);
             }
        }

        return matches;

    } catch (error) {
        console.error('[FootballService] Error getting matches:', error);
        return [];
    }
  }

  async syncUpcomingSchedule(startDate: string, daysToSync: number = 7) {
      // Sync next N days using API-Football
      const addDays = (d: string, days: number) => {
          const date = new Date(d);
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
      };
      const toDate = addDays(startDate, daysToSync);
      
      console.log(`[FootballService] Syncing schedule from ${startDate} to ${toDate} (${daysToSync} days) using API-Football...`);
      
      await this.configureAdapter();

      try {
          const matches = await this.apiFootball.getMatchesRange(startDate, toDate);
          
          if (matches.length === 0) {
              console.log('[FootballService] No matches found for schedule.');
              return;
          }

          console.log(`[FootballService] Found ${matches.length} matches. Upserting...`);

          for (const m of matches) {
              await matchRepository.upsertMatch({ ...m, provider: 'api-football' });
          }

          // Mark days as synced
          // Re-calculate date loop because we modified 'curr' in place or need fresh loop
          const syncStart = new Date(startDate);
          const syncEnd = new Date(toDate);
          for (let d = new Date(syncStart); d <= syncEnd; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              await syncStatusRepository.markAsSynced(dateStr);
          }

          console.log(`[FootballService] Synced schedule successfully.`);
      } catch (e) {
          console.error('[FootballService] Schedule sync failed:', e);
          throw e;
      }
  }

  async syncLiveMatches(): Promise<void> {
      const today = new Date().toISOString().split('T')[0];
      auditService.log('syncLiveMatches', `Syncing live matches for ${today}`);

      await this.configureAdapter();
      
      try {
          // Fetch all matches for today from API-Football
          const matches = await this.apiFootball.getMatches(today);
          
          if (matches.length > 0) {
              // 1. Fetch current DB state to preserve event data if API returns bad data
              const dbMatches = await matchRepository.getMatchesByDate(today);
              const dbMatchMap = new Map(dbMatches.map(m => [m.id, m]));

              const matchesWithEvents = matches.filter(m => m.events && m.events.length > 0).length;
              console.log(`[FootballService] Received ${matches.length} matches for today. (Matches with events: ${matchesWithEvents}). Updating DB...`);
              
              for (const m of matches) {
                  const dbMatch = dbMatchMap.get(m.id);
                  const matchToSave = { ...m, provider: 'api-football' };

                  // Logic to preserve good events from DB if API sends bad ones
                  if (m.events && m.events.length > 0) {
                       // Check if API events have missing names
                       const hasBadEvents = m.events.some(e => e.type === 'GOAL' && !e.player.name);
                       
                       if (hasBadEvents && dbMatch && dbMatch.events && dbMatch.events.length > 0) {
                           const dbHasGoodEvents = dbMatch.events.some(e => e.type === 'GOAL' && e.player.name);
                           
                           if (dbHasGoodEvents) {
                               // API has bad events, DB has good events.
                               // Only overwrite if score changed (implies new events we must capture, even if bad)
                               const scoreChanged = (m.score.fullTime.home !== dbMatch.score.fullTime.home) || 
                                                    (m.score.fullTime.away !== dbMatch.score.fullTime.away);
                                                    
                               if (!scoreChanged) {
                                   // Score same, prefer DB events with names
                                   matchToSave.events = dbMatch.events;
                               }
                           }
                       }
                  }

                  // @ts-expect-error - upsertMatch types might mismatch with raw API object but it works
                  await matchRepository.upsertMatch(matchToSave);
              }

              // 2. Enrichment: Check for matches that need detailed data (scorers)
              const matchesNeedingDetails = matches.filter(m => {
                  const totalGoals = (m.score.fullTime.home || 0) + (m.score.fullTime.away || 0);
                  if (totalGoals === 0) return false;
                  
                  if (!['IN_PLAY', 'PAUSED', 'HALFTIME', 'LIVE', '1H', '2H', 'ET', 'P', 'BT', 'FINISHED'].includes(m.status)) return false;

                  // If API returns empty events but score > 0, we need details.
                  if (!m.events || m.events.length === 0) return true;
                  
                  // If API returns events with missing names
                  const hasBadGoal = m.events.some(e => e.type === 'GOAL' && !e.player.name);
                  return hasBadGoal;
              });

              if (matchesNeedingDetails.length > 0) {
                  console.log(`[FootballService] Found ${matchesNeedingDetails.length} matches needing scorer details.`);
                  // Limit to 3 to protect rate limit (runs every 5 mins)
                  const queue = matchesNeedingDetails.slice(0, 3);
                  
                  for (const m of queue) {
                      console.log(`[FootballService] Enriching match ${m.id} to get scorers...`);
                      try {
                          const details = await this.apiFootball.getMatchDetails(m.id);
                          await matchRepository.updateMatchStatus(
                            details.id,
                            details.status,
                            details.minute,
                            details.score.fullTime.home,
                            details.score.fullTime.away,
                            details.events,
                            details.venue,
                            details.statistics
                          );
                      } catch (e) {
                          console.error(`[FootballService] Failed to enrich match ${m.id}`, e);
                      }
                  }
              }

          } else {
              console.log('[FootballService] No matches returned for today.');
          }
      } catch (e) {
          console.error('[FootballService] Error during live sync:', e);
      }
  }

  async getMatchDetails(id: number): Promise<MatchDetail> {
      auditService.log('getMatchDetails', `Fetching details for match ${id}`);
      await this.configureAdapter();

      // 1. Try DB First to save API quota
      try {
          const dbMatch = await matchRepository.getMatchById(id);
          if (dbMatch) {
              const isScheduled = dbMatch.status === 'SCHEDULED' || dbMatch.status === 'TIMED' || dbMatch.status === 'POSTPONED';
              // Check if we have detailed data
              const hasData = (dbMatch.events && dbMatch.events.length > 0) || (dbMatch.statistics && dbMatch.statistics.length > 0);
              
              // If it's scheduled (no data expected) or we have data, return DB
              if (isScheduled || hasData) {
                  return {
                      ...dbMatch,
                      events: dbMatch.events || [],
                      statistics: dbMatch.statistics || []
                  } as MatchDetail;
              }
              // If Live/Finished and missing data, fetch from API
          }
      } catch (e) {
          console.warn('[FootballService] DB lookup failed for details:', e);
      }

      // 2. Fetch from API
      try {
          const details = await this.apiFootball.getMatchDetails(id);
          
          // Update DB
          await matchRepository.updateMatchStatus(
            details.id,
            details.status,
            details.minute,
            details.score.fullTime.home,
            details.score.fullTime.away,
            details.events,
            details.venue,
            details.statistics
          );

          return details;
      } catch (error) {
          console.error(`[FootballService] Could not get details for ${id}:`, error);
          throw error;
      }
  }

  async getUpcomingMatches(teamNames: string[]): Promise<Match[]> {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      
      const endDateDate = new Date();
      endDateDate.setDate(today.getDate() + 14);
      const endDate = endDateDate.toISOString().split('T')[0];

      try {
          const allMatches = await matchRepository.getMatchesByDateRange(startDate, endDate);
          
          // Filter by team names
          // We look for matches where home or away team name (or part of it) matches one of the user's teams
          const relevantMatches = allMatches.filter(match => {
              const home = (match.homeTeam.name || '').toLowerCase();
              const away = (match.awayTeam.name || '').toLowerCase();
              
              return teamNames.some(userTeam => {
                  const t = userTeam.toLowerCase();
                  return home.includes(t) || away.includes(t);
              });
          });

          // Sort by date and limit to 4
          return relevantMatches
              .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
              .slice(0, 4);
              
      } catch (error) {
          console.error('[FootballService] Error getting upcoming matches:', error);
          return [];
      }
  }
}

export const footballService = new FootballService();
