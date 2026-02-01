import { IFootballProvider, Match, MatchDetail } from '../../interfaces.js';
import { footballDataClient } from './index.js';
import { mapMatchToDomain } from './mappers.js';

export class FootballDataOrgAdapter implements IFootballProvider {
  name = 'football-data';
  // Standard competition IDs supported by the free tier/project
  // Initialize with EMPTY to prevent accidental leakage of unwanted leagues if config fails.
  private competitionIds: number[] = [];

  setAllowedLeagues(ids: number[]) {
    this.competitionIds = ids;
  }

  async getMatches(date: string): Promise<Match[]> {
    // Safety check: If no competitions are allowed/configured, DO NOT fetch from API without filters.
    // Fetching without 'competitions' param returns ALL global matches (garbage).
    if (this.competitionIds.length === 0) {
        console.warn('[FootballDataOrgAdapter] No allowed leagues configured. Blocking request to prevent data leakage.');
        return [];
    }

    // football-data.org getMatches requires a range or filters
    // We can just ask for that specific date
    try {
      const response = await footballDataClient.getMatches(date, date, this.competitionIds);
      return response.matches.map(m => ({
        ...mapMatchToDomain(m),
        provider: 'football-data'
      }));
    } catch (error) {
      console.error('[FootballDataOrgAdapter] getMatches error:', error);
      throw error;
    }
  }

  async getMatchesRange(from: string, to: string): Promise<Match[]> {
    if (this.competitionIds.length === 0) {
        console.warn('[FootballDataOrgAdapter] No allowed leagues configured. Blocking range request.');
        return [];
    }

    try {
      const response = await footballDataClient.getMatches(from, to, this.competitionIds);
      // Extra safety: Filter result again in case API ignored the filter
      const safeMatches = response.matches.filter(m => this.competitionIds.includes(m.competition.id));
      
      return safeMatches.map(m => ({
        ...mapMatchToDomain(m),
        provider: 'football-data'
      }));
    } catch (error) {
      console.error('[FootballDataOrgAdapter] getMatchesRange error:', error);
      throw error;
    }
  }

  async getMatchDetails(id: number): Promise<MatchDetail> {
    try {
      const match = await footballDataClient.getMatch(id);
      const domainMatch = mapMatchToDomain(match);
      return {
        ...domainMatch,
        events: [], // Not supported in basic response or implemented yet
        statistics: [],
        provider: 'football-data'
      };
    } catch (error) {
      console.error('[FootballDataOrgAdapter] getMatchDetails error:', error);
      throw error;
    }
  }

  async getLiveMatches(): Promise<Match[]> {
    // API allows status filter, but our client might not expose it directly in getMatches arguments easily without modification.
    // However, getMatches takes (from, to, competitionIds).
    // To get live, we usually filter by status='LIVE' etc. 
    // If the client doesn't support status param, we fetch today and filter manually.
    const today = new Date().toISOString().split('T')[0];
    const matches = await this.getMatches(today);
    return matches.filter(m => ['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status));
  }
}
