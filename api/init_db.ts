import { pool } from './db.js';

const createTables = async () => {
  try {
    console.log('Creating tables (Postgres)...');

    // Enable UUID extension if not available (standard in Postgres 13+, but good to ensure)
    // Vercel Postgres usually has this enabled or available.
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Create matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY,
        home_team VARCHAR(100) NOT NULL,
        away_team VARCHAR(100) NOT NULL,
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        status VARCHAR(20) NOT NULL,
        minute INTEGER,
        match_date VARCHAR(100), -- Keeping as VARCHAR for ISO strings compatibility
        competition VARCHAR(100),
        competition_id INTEGER,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        home_team_id INTEGER,
        away_team_id INTEGER,
        home_team_crest VARCHAR(255),
        away_team_crest VARCHAR(255),
        competition_emblem VARCHAR(255),
        stage VARCHAR(50),
        group_name VARCHAR(50),
        provider VARCHAR(50) DEFAULT 'football-data'
      );
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_competition_id ON matches(competition_id);');

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id),
        type VARCHAR(50) NOT NULL,
        minute INTEGER NOT NULL,
        player VARCHAR(100),
        team VARCHAR(100),
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_events_match_id ON events(match_id);');

    // Create allowed_leagues table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS allowed_leagues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        football_data_id INTEGER,
        api_football_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        preferences TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed allowed_leagues
    try {
        const checkLeagues = await pool.query('SELECT count(*) as count FROM allowed_leagues');
        if (parseInt(checkLeagues.rows[0].count) === 0) {
            console.log('Seeding allowed_leagues...');
            const leagues = [
                { name: 'Premier League', fd_id: 2021, af_id: 39 },
                { name: 'UEFA Champions League', fd_id: 2001, af_id: 2 },
                { name: 'Primera Division', fd_id: 2014, af_id: 140 },
                { name: 'Ligue 1', fd_id: 2015, af_id: 61 }
            ];
            
            for (const l of leagues) {
                await pool.query(
                    'INSERT INTO allowed_leagues (name, football_data_id, api_football_id) VALUES ($1, $2, $3)',
                    [l.name, l.fd_id, l.af_id]
                );
            }
            console.log('Seeding completed.');
        }
    } catch (e) {
        console.error('Seeding error', e);
    }

    console.log('Tables created successfully');
  } catch (e) {
    console.error('Error creating tables', e);
  } finally {
      // Don't close pool here if this script is imported, but if run standalone, maybe.
      // Usually init_db is run as a script.
      if (require.main === module) {
          await pool.end();
      }
  }
};

// If run directly
if (process.argv[1] === import.meta.url || process.argv[1].endsWith('init_db.ts')) {
    createTables();
}

export default createTables;
