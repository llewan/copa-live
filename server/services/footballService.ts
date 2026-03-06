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
        const minIntervalMs = 15 * 60 * 1000; // 15 minutes
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

  async syncUpcomingSchedule(startDate: string) {
      // Sync next 7 days using API-Football
      const addDays = (d: string, days: number) => {
          const date = new Date(d);
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
      };
      const toDate = addDays(startDate, 7);
      
      console.log(`[FootballService] Syncing schedule from ${startDate} to ${toDate} using API-Football...`);
      
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
          const curr = new Date(startDate);
          const end = new Date(toDate);
          while (curr <= end) {
              const d = curr.toISOString().split('T')[0];
              await syncStatusRepository.markAsSynced(d);
              curr.setDate(curr.getDate() + 1);
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
          // This includes Live, Finished, Scheduled - everything for today.
          // This is "one API call" to refresh the whole day.
          const matches = await this.apiFootball.getMatches(today);
          
          if (matches.length > 0) {
              console.log(`[FootballService] Received ${matches.length} matches for today. Updating DB...`);
              for (const m of matches) {
                  // Update detailed status including events and stats
                  await matchRepository.updateMatchStatus(
                      m.id,
                      m.status,
                      m.minute,
                      m.score.fullTime.home,
                      m.score.fullTime.away,
                      m.events,
                      m.venue,
                      m.statistics
                  );
                  // Also upsert to ensure provider and other metadata are correct
                   await matchRepository.upsertMatch({ ...m, provider: 'api-football' });
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUpcomingMatches(_teamNames: string[]): Promise<Match[]> {
      return [];
  }
}

export const footballService = new FootballService();
