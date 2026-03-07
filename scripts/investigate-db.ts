
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use POSTGRES_URL from environment variables (standard for Vercel Postgres)
// or fallback to individual vars if needed
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.DB_DATABASE_URL_UNPOOLED || 
  process.env.DB_POSTGRES_URL;

if (!connectionString) {
  console.error('CRITICAL: Database connection string not found. Please set POSTGRES_URL or DATABASE_URL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Usually required for production/cloud DBs
});

async function runInvestigation() {
  console.log('--- Database Investigation Started ---');
  console.log(`Connecting to database...`);

  const client = await pool.connect();
  try {
    console.log('✅ Connected successfully.');

    // 1. Check Tables Existence
    console.log('\n--- Table Checks ---');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables:', tables.join(', '));

    if (!tables.includes('allowed_leagues')) console.error('❌ Missing table: allowed_leagues');
    if (!tables.includes('matches')) console.error('❌ Missing table: matches');
    if (!tables.includes('daily_sync_status')) console.error('❌ Missing table: daily_sync_status');

    // 2. Check Allowed Leagues
    if (tables.includes('allowed_leagues')) {
      console.log('\n--- Allowed Leagues ---');
      const leaguesCount = await client.query('SELECT count(*) FROM allowed_leagues');
      console.log(`Total Allowed Leagues: ${leaguesCount.rows[0].count}`);
      
      const leagues = await client.query('SELECT * FROM allowed_leagues ORDER BY id');
      if (leagues.rows.length > 0) {
        console.log('Leagues:', leagues.rows.map(l => `${l.name} (API-Football: ${l.api_football_id})`).join(', '));
      } else {
        console.log('⚠️ No allowed leagues found! Matches will not be synced.');
      }
    }

    // 3. Check Matches
    if (tables.includes('matches')) {
      console.log('\n--- Matches Data ---');
      const matchesCount = await client.query('SELECT count(*) FROM matches');
      console.log(`Total Matches Stored: ${matchesCount.rows[0].count}`);

      // Check matches around today
      console.log('Matches by Date (Last 3 days & Next 3 days):');
      try {
        const dateStats = await client.query(`
          SELECT match_date::date as date_val, count(*) as count
          FROM matches 
          WHERE match_date::date >= CURRENT_DATE - INTERVAL '3 days' 
            AND match_date::date <= CURRENT_DATE + INTERVAL '3 days'
          GROUP BY match_date::date 
          ORDER BY match_date::date
        `);
        if (dateStats.rows.length === 0) {
          console.log('⚠️ No matches found for +/- 3 days from today.');
        } else {
          dateStats.rows.forEach(r => {
              // format date string manually to avoid timezone shift in display if possible
              const dateStr = r.date_val instanceof Date ? r.date_val.toISOString().split('T')[0] : r.date_val;
              console.log(`  ${dateStr}: ${r.count} matches`);
          });
        }
      } catch (e) {
        console.error('Error querying matches by date:', e.message);
        console.log('Sample match_date values:', (await client.query('SELECT match_date FROM matches LIMIT 5')).rows);
      }

      // Check Status distribution
      console.log('Matches by Status (All time):');
      const statusStats = await client.query(`
        SELECT status, count(*) as count
        FROM matches 
        GROUP BY status
        ORDER BY count DESC
      `);
      statusStats.rows.forEach(r => {
        console.log(`  ${r.status}: ${r.count}`);
      });
    }

    // 4. Check Sync Status
    if (tables.includes('daily_sync_status')) {
      console.log('\n--- Sync Status ---');
      const syncStats = await client.query('SELECT * FROM daily_sync_status ORDER BY updated_at DESC LIMIT 5');
      if (syncStats.rows.length === 0) {
        console.log('⚠️ No sync history found.');
      } else {
        syncStats.rows.forEach(r => {
          console.log(`  ${r.date}: ${r.status} (Updated: ${r.updated_at})`);
        });
      }
    }

  } catch (err) {
    console.error('❌ Error during investigation:', err);
  } finally {
    client.release();
    await pool.end();
    console.log('\n--- Investigation Completed ---');
  }
}

runInvestigation().catch(console.error);
