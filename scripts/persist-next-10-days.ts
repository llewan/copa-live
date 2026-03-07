
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
  console.error('CRITICAL: Database connection string not found.');
  process.exit(1);
}

// Add API Key for API-Football
if (!process.env.API_FOOTBALL_KEY) {
    console.error('CRITICAL: API_FOOTBALL_KEY not found in env.');
    process.exit(1);
}

async function persistNext10Days() {
    console.log('--- Persisting Next 10 Days Schedule ---');
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Sync 10 days starting from today
        await footballService.syncUpcomingSchedule(today, 10);
        
        console.log('\n✅ Successfully persisted schedule for next 10 days.');
    } catch (err) {
        console.error('❌ Persistence failed:', err);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

persistNext10Days();
