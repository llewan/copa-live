import { IFootballProvider, Match, MatchDetail } from '../../interfaces.js';
import { apiFootballClient } from './client.js';
import { mapFixtureToMatch, mapFixtureToMatchDetail } from './mappers.js';

export class ApiFootballComAdapter implements IFootballProvider {
  name = 'api-football';
  private allowedLeagueIds: number[] = [];

  setAllowedLeagues(ids: number[]) {
    this.allowedLeagueIds = ids;
  }

  async getMatches(date: string): Promise<Match[]> {
    try {
      const response = await apiFootballClient.getFixturesByDate(date);
      
      // Strict filtering: If no allowed leagues are configured (yet), block everything to be safe.
      // This prevents "leakage" if configuration fails.
      if (this.allowedLeagueIds.length === 0) {
          console.warn('[ApiFootballComAdapter] No allowed leagues configured. Blocking all matches.');
          return [];
      }

      // Automatically filter matches based on allowed leagues
      const filtered = response.response.filter(f => this.allowedLeagueIds.includes(f.league.id));
      
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
        const response = await apiFootballClient.get('/fixtures', { from, to });
        const filtered = response.response.filter(f => this.allowedLeagueIds.includes(f.league.id));
        return filtered.map(mapFixtureToMatch);
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
