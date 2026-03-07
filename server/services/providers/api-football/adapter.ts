import { IFootballProvider, Match, MatchDetail } from '../../interfaces.js';
import { apiFootballClient } from './client.js';
import { mapFixtureToMatch, mapFixtureToMatchDetail } from './mappers.js';

import { ApiFootballFixture } from './types.js';

export class ApiFootballComAdapter implements IFootballProvider {
  name = 'api-football';
  private allowedLeagueIds: number[] = [];

  setAllowedLeagues(ids: number[]) {
    this.allowedLeagueIds = ids;
  }

  async getMatches(date: string): Promise<Match[]> {
    try {
      // Fetch matches for the date
      // We explicitly include 'events' in the timezone or other params if needed, 
      // but standard endpoint returns events if they exist.
      // However, for list view, we might need to be careful about response size.
      // Let's verify if getFixturesByDate returns events.
      // According to docs, /fixtures?date=... returns full fixture objects including events!
      // So the issue might be mapping or repository upsert.
      
      const response = await apiFootballClient.getFixturesByDate(date);
      
      console.log(`[ApiFootballComAdapter] Raw API response: ${response.response.length} matches`);

      // Strict filtering: If no allowed leagues are configured (yet), block everything to be safe.
      // This prevents "leakage" if configuration fails.
      if (this.allowedLeagueIds.length === 0) {
          console.warn('[ApiFootballComAdapter] No allowed leagues configured. Blocking all matches.');
          return [];
      }

      // Automatically filter matches based on allowed leagues
      const filtered = response.response.filter(f => this.allowedLeagueIds.includes(f.league.id));
      
      console.log(`[ApiFootballComAdapter] Filtered matches: ${filtered.length} (Allowed Leagues: ${this.allowedLeagueIds.join(', ')})`);

      // Debug: Log first match to see if events are present
      if (filtered.length > 0) {
          const first = filtered[0];
          console.log(`[ApiFootballComAdapter] Sample match ${first.fixture.id} events count: ${first.events?.length || 0}`);
      }

      return filtered.map(mapFixtureToMatch);
    } catch (error) {
      console.error('[ApiFootballComAdapter] getMatches error:', error);
      throw error;
    }
  }

  async getMatchesRange(from: string, to: string): Promise<Match[]> {
    if (this.allowedLeagueIds.length === 0) {
        console.warn('[ApiFootballComAdapter] No allowed leagues configured. Blocking range request.');
        return [];
    }

    try {
        // API-Football requires 'season' or 'league' when using from/to.
        // We cannot just ask for "all matches in the world between X and Y".
        // This is a constraint of the API.
        // Note: The 'next' parameter is not available on the Free plan (returns 403/Error).
        // Workaround: Loop through allowed leagues and fetch schedule for each?
        // OR: Loop through DATES and fetch 'fixtures?date=...' for each day.
        // Fetching by date is allowed globally.
        // Given we are syncing 7-10 days, fetching 7-10 dates is better than fetching N leagues * 1 season.
        
        console.log(`[ApiFootballComAdapter] Syncing range ${from} to ${to}. Strategy: Fetch by DATE to avoid league/season params.`);
        
        const start = new Date(from);
        const end = new Date(to);
        let allMatches: ApiFootballFixture[] = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            // Respect rate limit... maybe adding a small delay if needed, but client handles it.
            const response = await apiFootballClient.getFixturesByDate(dateStr);
            if (response.response) {
                const filtered = response.response.filter(f => this.allowedLeagueIds.includes(f.league.id));
                allMatches = [...allMatches, ...filtered];
            }
        }
        
        return allMatches.map(mapFixtureToMatch);
    } catch (error) {
        console.error('[ApiFootballComAdapter] getMatchesRange error:', error);
        throw error;
    }
  }

  async getMatchDetails(id: number): Promise<MatchDetail> {
    try {
      const response = await apiFootballClient.getFixtureById(id);
      if (response.response.length === 0) {
          throw new Error('Match not found');
      }
      // Note: For details, we might not strictly enforce league ID if the user requests a specific ID,
      // but to be safe we could check it. However, usually details are requested after listing.
      // If strict compliance is needed:
      const fixture = response.response[0];
      if (this.allowedLeagueIds.length > 0 && !this.allowedLeagueIds.includes(fixture.league.id)) {
          throw new Error('Match not allowed');
      }
      return mapFixtureToMatchDetail(fixture);
    } catch (error) {
      console.error('[ApiFootballComAdapter] getMatchDetails error:', error);
      throw error;
    }
  }

  async getLiveMatches(): Promise<Match[]> {
    try {
      const response = await apiFootballClient.getLiveFixtures();
      
      if (this.allowedLeagueIds.length === 0) {
          console.warn('[ApiFootballComAdapter] No allowed leagues configured. Blocking all matches.');
          return [];
      }

      const filtered = response.response.filter(f => this.allowedLeagueIds.includes(f.league.id));
      return filtered.map(mapFixtureToMatch);
    } catch (error) {
      console.error('[ApiFootballComAdapter] getLiveMatches error:', error);
      throw error;
    }
  }
}
