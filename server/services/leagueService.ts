import { pool } from '../db.js';

export interface AllowedLeague {
  id: number;
  name: string;
  football_data_id: number;
  api_football_id: number;
  is_active: boolean;
}

export class LeagueService {
  private cache: AllowedLeague[] | null = null;
  private lastFetch: number = 0;
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour

  async getAllowedLeagues(): Promise<AllowedLeague[]> {
    const now = Date.now();
    if (this.cache && (now - this.lastFetch < this.CACHE_TTL)) {
      return this.cache;
    }

    try {
      // Postgres boolean fields should be queried with boolean literals (true/false)
      const result = await pool.query('SELECT * FROM allowed_leagues WHERE is_active = true');
      this.cache = result.rows;
      this.lastFetch = now;
      return this.cache;
    } catch (error) {
      console.error('[LeagueService] Error fetching allowed leagues:', error);
      return [];
    }
  }

  async getFootballDataIds(): Promise<number[]> {
    const leagues = await this.getAllowedLeagues();
    return leagues.map(l => l.football_data_id).filter(id => id !== null && id !== undefined);
  }

  async getApiFootballIds(): Promise<number[]> {
    const leagues = await this.getAllowedLeagues();
    return leagues.map(l => l.api_football_id).filter(id => id !== null && id !== undefined);
  }

  async isLeagueAllowed(leagueId: number, provider: 'football-data' | 'api-football'): Promise<boolean> {
    const leagues = await this.getAllowedLeagues();
    if (provider === 'football-data') {
      return leagues.some(l => l.football_data_id === leagueId);
    } else {
      return leagues.some(l => l.api_football_id === leagueId);
    }
  }
}

export const leagueService = new LeagueService();
