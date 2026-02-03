
import { pool } from '../db.js';
import { Match, MatchEvent, MatchStatistic } from '../services/interfaces.js';

import { leagueService } from '../services/leagueService.js';

export const matchRepository = {
  async upsertMatch(match: Match) {
    // Gatekeeper: Validate allowed league before upserting
    // We check against the allowed leagues cache
    // This prevents ANY source from writing invalid leagues to DB
    const isAllowed = await leagueService.isLeagueAllowed(match.competition.id, match.provider || 'football-data');
    
    if (!isAllowed) {
        // console.warn(`[MatchRepository] Blocked upsert for match ${match.id} (League ID: ${match.competition.id} not allowed)`);
        return;
    }

    // Map domain match to DB columns
    // We use match_date for the ISO date string
    const query = `
      INSERT INTO matches (
        id, match_date, status, minute, 
        home_team_id, home_team, home_team_crest, home_score,
        away_team_id, away_team, away_team_crest, away_score,
        competition, competition_emblem, stage, group_name,
        provider, competition_id,
        venue, statistics,
        last_updated
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18,
        $19, $20,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        match_date=excluded.match_date,
        status=excluded.status,
        minute=excluded.minute,
        home_score=excluded.home_score,
        away_score=excluded.away_score,
        provider=excluded.provider,
        competition_id=excluded.competition_id,
        venue=excluded.venue,
        statistics=excluded.statistics,
        last_updated=CURRENT_TIMESTAMP
    `;
    
    const params = [
        match.id,
        match.utcDate, // Maps to match_date
        match.status,
        match.minute,
        match.homeTeam.id,
        match.homeTeam.name,
        match.homeTeam.crest,
        match.score.fullTime.home,
        match.awayTeam.id,
        match.awayTeam.name,
        match.awayTeam.crest,
        match.score.fullTime.away,
        match.competition.name,
        match.competition.emblem,
        match.stage,
        match.group,
        match.provider || 'football-data',
        match.competition.id,
        match.venue || null,
        JSON.stringify(match.statistics || [])
    ];

    try {
        await pool.query(query, params);

        // Handle events
        if (match.events && match.events.length > 0) {
            // Delete old events
            await pool.query('DELETE FROM events WHERE match_id = $1', [match.id]);
            
            // Insert new events
            for (const event of match.events) {
                await pool.query(`
                    INSERT INTO events (match_id, type, minute, player, team)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    match.id,
                    event.type,
                    event.minute,
                    event.player.name,
                    event.team.name
                ]);
            }
        }
    } catch (e) {
        console.error('Error upserting match:', e);
    }
  },

  async attachEventsToMatches(matches: Match[]): Promise<Match[]> {
      if (matches.length === 0) return matches;

      const ids = matches.map(m => m.id);
      // Create placeholders $1, $2, etc.
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      
      const query = `SELECT * FROM events WHERE match_id IN (${placeholders})`;
      
      try {
          const result = await pool.query(query, ids);
          const events = result.rows;
          
          return matches.map(match => {
              const matchEvents = events
                  .filter((e: { match_id: number }) => e.match_id === match.id)
                  .map((e: { type: string; minute: number; player: string; team: string }) => ({
                      type: e.type,
                      minute: e.minute,
                      player: { name: e.player },
                      team: { name: e.team }
                  }));
              
              return { ...match, events: matchEvents };
          });
      } catch (e) {
          console.error('Error fetching events:', e);
          return matches;
      }
  },

  async updateMatchStatus(id: number, status: string, minute: number | null, homeScore: number | null, awayScore: number | null, events: MatchEvent[] = [], venue: string | null = null, statistics: MatchStatistic[] = []) {
    try {
        await pool.query(`
            UPDATE matches 
            SET status = $1, minute = $2, home_score = $3, away_score = $4, venue = $6, statistics = $7, last_updated = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [status, minute, homeScore, awayScore, id, venue, JSON.stringify(statistics)]);

        if (events.length > 0) {
            await pool.query('DELETE FROM events WHERE match_id = $1', [id]);
            for (const event of events) {
                await pool.query(`
                    INSERT INTO events (match_id, type, minute, player, team)
                    VALUES ($1, $2, $3, $4, $5)
                `, [id, event.type, event.minute, event.player.name, event.team.name]);
            }
        }
    } catch (e) {
        console.error('[MatchRepository] Error updating match status:', e);
    }
  },

  async deleteMatch(id: number) {
    try {
        await pool.query('DELETE FROM events WHERE match_id = $1', [id]);
        await pool.query('DELETE FROM matches WHERE id = $1', [id]);
    } catch (e) {
        console.error('[MatchRepository] Error deleting match:', e);
    }
  },

  async getMatchesByDate(dateStr: string): Promise<Match[]> {
      // Find matches where match_date starts with the requested date (YYYY-MM-DD)
      const query = `
        SELECT * FROM matches 
        WHERE match_date LIKE $1 || '%'
        ORDER BY match_date ASC
      `;
      
      const result = await pool.query(query, [dateStr]);
      
      const matches = result.rows.map(this.mapRowToMatch);
      return this.attachEventsToMatches(matches);
  },

  async getMatchesByDateRange(startDate: string, endDate: string): Promise<Match[]> {
      // Find matches where match_date is between start and end date (inclusive)
      const query = `
        SELECT * FROM matches 
        WHERE match_date >= $1 AND match_date <= $2 || 'T23:59:59.999Z'
        ORDER BY match_date ASC
      `;
      
      const result = await pool.query(query, [startDate, endDate]);
      
      const matches = result.rows.map(this.mapRowToMatch);
      return this.attachEventsToMatches(matches);
  },

  // Helper to map DB row to Domain Object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapRowToMatch(row: any): Match {
      return {
          id: row.id,
          utcDate: row.match_date,
          status: row.status,
          minute: row.minute,
          homeTeam: {
              id: row.home_team_id,
              name: row.home_team,
              crest: row.home_team_crest
          },
          awayTeam: {
              id: row.away_team_id,
              name: row.away_team,
              crest: row.away_team_crest
          },
          score: {
              fullTime: {
                  home: row.home_score,
                  away: row.away_score
              }
          },
          competition: {
              id: row.competition_id,
              name: row.competition,
              emblem: row.competition_emblem
          },
          stage: row.stage,
          group: row.group_name,
          provider: row.provider,
          venue: row.venue,
          statistics: row.statistics || []
      };
  },

  async getMatchById(id: number): Promise<Match | null> {
      const result = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      
      const match = this.mapRowToMatch(result.rows[0]);
      const matchesWithEvents = await this.attachEventsToMatches([match]);
      return matchesWithEvents[0];
  },

  async getMatchesNeedingUpdates(dateStr: string): Promise<Match[]> {
      // Get matches for the specific date that are either:
      // 1. Live (IN_PLAY, PAUSED, HALFTIME, etc)
      // 2. Scheduled to start within the next 5 minutes (or recently started but status not updated)
      // We'll fetch all matches for the date and filter in application logic for complex time math
      // to avoid SQLite timezone headaches.
      const query = `
        SELECT * FROM matches 
        WHERE match_date LIKE $1 || '%'
        AND (
            status IN ('IN_PLAY', 'PAUSED', 'HALFTIME', 'LIVE', '1H', '2H', 'ET', 'P', 'BT')
            OR status = 'TIMED' 
            OR status = 'SCHEDULED'
        )
      `;
      
      const result = await pool.query(query, [dateStr]);
      return result.rows.map(this.mapRowToMatch);
  }
};
