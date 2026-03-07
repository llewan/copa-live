
import dotenv from 'dotenv';
import { footballService } from '../server/services/footballService.js';
import { pool } from '../server/db.js';

dotenv.config();

// Ensure DB connection string is set
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.DB_DATABASE_URL_UNPOOLED || 
  process.env.DB_POSTGRES_URL;

if (!connectionString) {
  console.error('CRITICAL: Database connection string not found. Please set POSTGRES_URL or DATABASE_URL.');
  process.exit(1);
}

// Add API Key for API-Football
if (!process.env.API_FOOTBALL_KEY) {
    console.error('CRITICAL: API_FOOTBALL_KEY not found in env.');
    process.exit(1);
}

async function runManualSync() {
    console.log('--- Manual Sync Started ---');
    const today = new Date().toISOString().split('T')[0];
    console.log(`Date: ${today}`);

    try {
        console.log('\n--- Syncing Live Matches (Today) ---');
        await footballService.syncLiveMatches();

        console.log('\n--- Syncing Upcoming Schedule (Next 7 days) ---');
        await footballService.syncUpcomingSchedule(today);
        
        console.log('\n--- Sync Completed Successfully ---');
    } catch (err) {
        console.error('❌ Sync failed:', err);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

runManualSync();
