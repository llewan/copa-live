
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.DB_DATABASE_URL_UNPOOLED || 
  process.env.DB_POSTGRES_URL;

if (!connectionString) {
  console.error('CRITICAL: Database connection string not found.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const LEAGUES_TO_SEED = [
    // --- England (Complete) ---
    { name: 'Premier League', af_id: 39, fd_id: 2021 },
    { name: 'Championship', af_id: 40, fd_id: 2016 },
    { name: 'League One', af_id: 41, fd_id: null },
    { name: 'League Two', af_id: 42, fd_id: null },
    { name: 'FA Cup', af_id: 45, fd_id: null },
    { name: 'EFL Cup', af_id: 48, fd_id: null },
    { name: 'Community Shield', af_id: 528, fd_id: null },

    // --- Top European Leagues ---
    { name: 'La Liga', af_id: 140, fd_id: 2014 },
    { name: 'Bundesliga', af_id: 78, fd_id: 2002 },
    { name: 'Serie A', af_id: 135, fd_id: 2019 },
    { name: 'Ligue 1', af_id: 61, fd_id: 2015 },
    { name: 'Eredivisie', af_id: 88, fd_id: 2003 },
    { name: 'Primeira Liga', af_id: 94, fd_id: 2017 },

    // --- European Competitions ---
    { name: 'UEFA Champions League', af_id: 2, fd_id: 2001 },
    { name: 'UEFA Europa League', af_id: 3, fd_id: 2146 },
    { name: 'UEFA Conference League', af_id: 848, fd_id: 2154 },
    { name: 'UEFA Super Cup', af_id: 531, fd_id: 2154 },

    // --- South America ---
    { name: 'Copa Libertadores', af_id: 13, fd_id: 2038 },
    { name: 'Copa Sudamericana', af_id: 11, fd_id: null },
    { name: 'Argentine Primera División', af_id: 128, fd_id: null },
    // Removed: Brasileirão Série A (af_id: 71) as requested

    // --- International ---
    { name: 'World Cup', af_id: 1, fd_id: 2000 },
    { name: 'Euro Championship', af_id: 4, fd_id: 2018 },
    { name: 'Copa América', af_id: 9, fd_id: 2037 },
    { name: 'Africa Cup of Nations', af_id: 6, fd_id: null },
    
    // --- Others ---
    { name: 'MLS', af_id: 253, fd_id: null },
    { name: 'Saudi Pro League', af_id: 307, fd_id: null }
];

async function seedLeagues() {
    console.log('--- Seeding Allowed Leagues ---');
    const client = await pool.connect();
    
    try {
        for (const league of LEAGUES_TO_SEED) {
            console.log(`Processing: ${league.name} (ID: ${league.af_id})`);
            
            // Check if exists
            const res = await client.query(
                'SELECT id FROM allowed_leagues WHERE api_football_id = $1',
                [league.af_id]
            );

            if (res.rows.length === 0) {
                await client.query(
                    'INSERT INTO allowed_leagues (name, api_football_id, football_data_id, is_active) VALUES ($1, $2, $3, true)',
                    [league.name, league.af_id, league.fd_id]
                );
                console.log(`✅ Inserted ${league.name}`);
            } else {
                console.log(`ℹ️  Already exists: ${league.name}`);
            }
        }
        console.log('--- Seeding Completed ---');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedLeagues();
