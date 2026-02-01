import { IFootballProvider, Match, MatchDetail } from './interfaces.js';
import { FootballDataOrgAdapter } from './providers/football-data/adapter.js';
import { ApiFootballComAdapter } from './providers/api-football/adapter.js';
import { matchRepository } from '../repositories/matchRepository.js';
import { leagueService } from './leagueService.js';
import { auditService } from './auditService.js';
import { TeamNameMatcher } from './teamNameMatcher.js';

export class FootballService {
  private footballData: FootballDataOrgAdapter;
  private apiFootball: ApiFootballComAdapter;

  constructor(
    footballData?: FootballDataOrgAdapter,
    apiFootball?: ApiFootballComAdapter
  ) {
    this.footballData = footballData || new FootballDataOrgAdapter();
    this.apiFootball = apiFootball || new ApiFootballComAdapter();
  }

  private async configureAdapters() {
    try {
      const fdIds = await leagueService.getFootballDataIds();
      const afIds = await leagueService.getApiFootballIds();
      
      this.footballData.setAllowedLeagues(fdIds);
      this.apiFootball.setAllowedLeagues(afIds);
    } catch (e) {
      console.error('[FootballService] Error configuring adapters:', e);
    }
  }

  private getProvider(date: string): IFootballProvider {
    const today = new Date().toISOString().split('T')[0];
    // Strategy:
    // 1. Livescore / Today -> ApiFootball (better data, live events)
    // 2. Historical / Scheduled -> FootballData (cheaper, good for schedules)
    if (date === today) {
        return this.apiFootball;
    }
    return this.footballData;
  }

  async getMatches(dateStr?: string): Promise<Match[]> {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Audit Log
    auditService.log('getMatches', `Fetching matches for ${date}`);

    // Ensure adapters are configured with latest allowed leagues
    await this.configureAdapters();

    // 1. Try DB first (Cache)
    // For today, we might want fresh data, so we might skip DB or check last_updated.
    // Existing logic for today was: Sync 10 days, then return today.
    
    // New Logic with Adapters:
    
    try {
        // "Primary sets matches": ALWAYS start with what Football-Data knows (via DB or API)
        // Check DB for schedule first
        let baseMatches = await matchRepository.getMatchesByDate(date);

        // Filter matches by allowed leagues to ensure no "garbage" from DB is shown
        const allowedLeagues = await leagueService.getAllowedLeagues();
        const allowedFdIds = allowedLeagues.map(l => l.football_data_id).filter(id => id);
        const allowedAfIds = allowedLeagues.map(l => l.api_football_id).filter(id => id);

        // CLEANUP: Delete invalid matches from DB to fix the issue "once and for all"
        const invalidMatches = baseMatches.filter(m => {
             if (!m.competition.id) return true;
             if (m.provider === 'football-data') {
                 return !allowedFdIds.includes(m.competition.id);
             } else if (m.provider === 'api-football') {
                 return !allowedAfIds.includes(m.competition.id);
             }
             return true;
        });
        
        if (invalidMatches.length > 0) {
            console.log(`[FootballService] Found ${invalidMatches.length} invalid matches in DB. Deleting...`);
            for (const m of invalidMatches) {
                // Now we have deleteMatch
                await matchRepository.deleteMatch(m.id);
            }
        }

        baseMatches = baseMatches.filter(m => {
             // If competition.id is missing (old data), filter it out to force re-fetch
             if (!m.competition.id) return false;
             
             if (m.provider === 'football-data') {
                 return allowedFdIds.includes(m.competition.id);
             } else if (m.provider === 'api-football') {
                 return allowedAfIds.includes(m.competition.id);
             }
             return false;
        });
        
        // If DB is empty or we suspect it's stale (we don't track staleness well yet, but let's assume if empty), fetch from Primary
        if (baseMatches.length === 0) {
            console.log(`[FootballService] No matches in DB for ${date}. Fetching from Primary (Football-Data) for next 10 days...`);
            try {
                // Fetch schedule for Today -> Today + 10 days
                // This ensures we populate the DB for the near future
                const startDate = today;
                const endDate = new Date();
                endDate.setDate(new Date(startDate).getDate() + 10);
                const endDateStr = endDate.toISOString().split('T')[0];

                const primaryMatches = await this.footballData.getMatchesRange(startDate, endDateStr);
                
                // Save immediately to establish "The Schedule"
                for (const m of primaryMatches) {
                    await matchRepository.upsertMatch({ ...m, provider: 'football-data' });
                }
                
                // We only want to return matches for the requested 'date'
                baseMatches = primaryMatches.filter(m => m.utcDate.startsWith(date));
                
                // Re-filter by allowed leagues just in case
                baseMatches = baseMatches.filter(m => {
                    if (!m.competition.id) return false;
                    return allowedFdIds.includes(m.competition.id);
                });

            } catch (e) {
                console.error('[FootballService] Primary API failed to set schedule:', e);
                // If Primary fails, we have NO schedule.
                // We return empty array.
            }
        }

        // Return what we have in DB (or what we just fetched)
        // We do NOT query Secondary API here anymore. That is handled by syncLiveMatches.
        return baseMatches;

    } catch (error) {
        console.error('[FootballService] Error getting matches:', error);
        return [];
    }
  }

  private async checkAndResolveFinishedMatches(baseMatches: Match[], liveMatches: Match[], date: string) {
      // Identify matches that are supposedly Live in DB but missing from Live Feed
      const potentiallyFinished = baseMatches.filter(base => {
          const isLiveInDb = ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(base.status); // Add other live statuses if needed
          if (!isLiveInDb) return false;

          // Check if it exists in liveMatches
          const foundInLive = liveMatches.some(live => {
              const homeMatch = TeamNameMatcher.areTeamsSame(base.homeTeam.name, live.homeTeam.name);
              const awayMatch = TeamNameMatcher.areTeamsSame(base.awayTeam.name, live.awayTeam.name);
              return homeMatch && awayMatch;
          });

          return !foundInLive;
      });

      if (potentiallyFinished.length === 0) return;

      console.log(`[FootballService] Found ${potentiallyFinished.length} matches that might have just finished. Verifying...`);

      // We need to fetch the full schedule to find the API-Football ID and final status
      try {
          const allToday = await this.apiFootball.getMatches(date);
          
          for (const base of potentiallyFinished) {
              // Find the match in the full list
              const matchInAll = allToday.find(m => {
                  const homeMatch = TeamNameMatcher.areTeamsSame(base.homeTeam.name, m.homeTeam.name);
                  const awayMatch = TeamNameMatcher.areTeamsSame(base.awayTeam.name, m.awayTeam.name);
                  return homeMatch && awayMatch;
              });

              if (matchInAll && ['FINISHED', 'FT', 'AET', 'PEN'].includes(matchInAll.status)) {
                  console.log(`[FootballService] Match finished: ${base.homeTeam.name} vs ${base.awayTeam.name}. Fetching details for goals...`);
                  
                  // CRITICAL: Fetch details to get goal scorers/events
                  try {
                      const details = await this.apiFootball.getMatchDetails(matchInAll.id);
                      
                      await matchRepository.updateMatchStatus(
                          base.id,
                          details.status,
                          details.minute, // Should be 90 or 120
                          details.score.fullTime.home,
                          details.score.fullTime.away,
                          details.events // Save final events!
                      );
                  } catch (err) {
                      console.error(`[FootballService] Failed to fetch details for finished match ${matchInAll.id}:`, err);
                  }
              }
          }
      } catch (e) {
          console.error('[FootballService] Failed to resolve finished matches:', e);
      }
  }

  private async mergeAndSaveUpdates(baseMatches: Match[], liveMatches: Match[]) {
      const allowedLeagues = await leagueService.getAllowedLeagues();

      for (const base of baseMatches) {
          // 1. Resolve League ID mapping
          // We need to know what the Api-Football League ID is for this Football-Data match
          const leagueConfig = allowedLeagues.find(l => l.football_data_id === base.competition.id);
          
          // If no mapping exists, we can't safely link them (or we fall back to global search, but that's risky)
          if (!leagueConfig || !leagueConfig.api_football_id) {
              continue;
          }
          const targetLeagueId = leagueConfig.api_football_id;

          // 2. Filter Candidates by League
          // liveMatches already have mapped competition.id = Api-Football League ID
          let candidates = liveMatches.filter(m => m.competition.id === targetLeagueId);

          // 3. Filter by Time (Kickoff within 4 hours)
          // To handle timezones and slight delays, but ensure we don't match a morning game with an evening game if teams played twice (rare)
          const baseTime = new Date(base.utcDate).getTime();
          candidates = candidates.filter(m => {
              const liveTime = new Date(m.utcDate).getTime();
              const diffHours = Math.abs(liveTime - baseTime) / (1000 * 60 * 60);
              return diffHours < 4; 
          });

          if (candidates.length === 0) continue;

          // 4. Match Teams using Robust Matcher
          const update = candidates.find(live => {
              const homeMatch = TeamNameMatcher.areTeamsSame(base.homeTeam.name, live.homeTeam.name);
              const awayMatch = TeamNameMatcher.areTeamsSame(base.awayTeam.name, live.awayTeam.name);
              return homeMatch && awayMatch;
          });

          if (update) {
              // Update DB with fresh status/score from Secondary
              console.log(`[FootballService] Linked & Updated: ${base.homeTeam.name} vs ${base.awayTeam.name} (Status: ${update.status})`);
              await matchRepository.updateMatchStatus(
                  base.id, 
                  update.status, 
                  update.minute, 
                  update.score.fullTime.home, 
                  update.score.fullTime.away,
                  update.events // Update events too
              );
          } else {
             // Debug log to help diagnose missing links
             console.log(`[FootballService] No match found for ${base.homeTeam.name} vs ${base.awayTeam.name} among ${candidates.length} candidates.`);
             candidates.forEach(c => console.log(` - Candidate: ${c.homeTeam.name} vs ${c.awayTeam.name}`));
          }
      }
  }

  private async syncUpcomingSchedule(startDate: string) {
      // Sync next 10 days using Football-Data (as per requirements: "scheduled (up to 10 days) use football-data")
      const addDays = (d: string, days: number) => {
          const date = new Date(d);
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
      };
      const toDate = addDays(startDate, 10);
      
      console.log(`[FootballService] Syncing schedule from ${startDate} to ${toDate} using Football-Data...`);
      
      // Ensure configuration
      await this.configureAdapters();

      const allowedLeagues = await leagueService.getAllowedLeagues();
      const allowedFdIds = allowedLeagues.map(l => l.football_data_id).filter(id => id);

      try {
          const matches = await this.footballData.getMatchesRange(startDate, toDate);
          
          // Strict validation before saving
          const validMatches = matches.filter(m => m.competition.id && allowedFdIds.includes(m.competition.id));

          if (validMatches.length < matches.length) {
              console.warn(`[FootballService] Blocked ${matches.length - validMatches.length} matches from unallowed leagues during sync.`);
          }

          for (const m of validMatches) {
              await matchRepository.upsertMatch(m);
          }
          console.log(`[FootballService] Synced ${validMatches.length} upcoming matches.`);
      } catch (e) {
          console.error('[FootballService] Schedule sync failed:', e);
      }
  }

  async syncLiveMatches(): Promise<void> {
      const today = new Date().toISOString().split('T')[0];
      auditService.log('syncLiveMatches', `Checking for live matches to sync for ${today}`);

      // 1. Check if we need to poll
      // We look for matches that are Live or about to start
      const matchesNeedingUpdate = await matchRepository.getMatchesNeedingUpdates(today);
      
      const now = new Date();
      const fiveMinsFromNow = new Date(now.getTime() + 5 * 60000);

      const activeMatches = matchesNeedingUpdate.filter(m => {
          const matchDate = new Date(m.utcDate);
          const isLive = ['IN_PLAY', 'PAUSED', 'HALFTIME', 'LIVE', '1H', '2H', 'ET', 'P', 'BT', 'INT'].includes(m.status);
          
          // Check if starting soon (within 5 mins) OR started recently (past start time)
          // We include matches that should have started but are still SCHEDULED in DB
          const isTimeRelevant = matchDate <= fiveMinsFromNow;
          
          return isLive || (m.status === 'SCHEDULED' && isTimeRelevant);
      });

      if (activeMatches.length > 0) {
          console.log(`[FootballService] Found ${activeMatches.length} active/upcoming matches. Polling Secondary API (API-Football)...`);
          
          // 2. Poll Secondary API
          await this.configureAdapters();
          try {
              // User requested: "consultar la api secundaria con todos los partidos de las 4 ligas que soportamos para el dia de hoy"
              const secondaryMatches = await this.apiFootball.getMatches(today);
              
              if (secondaryMatches.length > 0) {
                  console.log(`[FootballService] Secondary API returned ${secondaryMatches.length} matches. Merging...`);
                  
                  // 3. Update DB
                  // We fetch all DB matches for today to ensure we have the full context for linking
                  const allDbMatches = await matchRepository.getMatchesByDate(today);
                  
                  await this.mergeAndSaveUpdates(allDbMatches, secondaryMatches);
                  
                  // Handle matches that finished since last poll
                  await this.checkAndResolveFinishedMatches(allDbMatches, secondaryMatches, today);
              } else {
                  console.log('[FootballService] Secondary API returned no matches for today.');
              }
              
          } catch (e) {
              console.error('[FootballService] Error during live sync:', e);
          }
      } else {
          // 3. Fallback: No Live matches -> Sync with Primary API (Football-Data)
          // "Solamente en el caso de no haber eventos sincronizar con la basde de datos primaria"
          // This ensures that if a match finished or was postponed, we get the update without using Secondary quota.
          console.log('[FootballService] No active live matches. Syncing with Primary API (Football-Data) to ensure consistency...');
          
          await this.configureAdapters();
          try {
              // We fetch today's matches from Primary
              const primaryMatches = await this.footballData.getMatches(today);
              
              const allowedLeagues = await leagueService.getAllowedLeagues();
              const allowedFdIds = allowedLeagues.map(l => l.football_data_id).filter(id => id);

              // Filter and Upsert
              const validMatches = primaryMatches.filter(m => m.competition.id && allowedFdIds.includes(m.competition.id));
              
              for (const m of validMatches) {
                  // We upsert. If it was SCHEDULED and is now FINISHED in Primary, this will update it.
                  await matchRepository.upsertMatch({ ...m, provider: 'football-data' });
              }
              console.log(`[FootballService] Synced ${validMatches.length} matches from Primary API.`);
              
          } catch (e) {
               console.error('[FootballService] Error syncing with Primary API:', e);
          }
      }
  }

  async getMatchDetails(id: number): Promise<MatchDetail> {
      auditService.log('getMatchDetails', `Fetching details for match ${id}`);
      await this.configureAdapters();

      // Try to determine provider. 
      // If we don't know, we try ApiFootball first (better details), then FootballData.
      try {
          return await this.apiFootball.getMatchDetails(id);
      } catch {
          console.warn(`[FootballService] Could not get details from ApiFootball for ${id}, trying FootballData...`);
          return await this.footballData.getMatchDetails(id);
      }
  }
 
  async getUpcomingMatches(_teamNames: string[]): Promise<Match[]> {
      return [];
  }
}

export const footballService = new FootballService();
