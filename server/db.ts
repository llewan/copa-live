import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use POSTGRES_URL from environment variables (standard for Vercel Postgres)
// or fallback to individual vars if needed (but usually POSTGRES_URL is enough)
// Also check for DB_ prefixed variables as seen in some Vercel environments
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.DB_DATABASE_URL_UNPOOLED || 
  process.env.DB_POSTGRES_URL;

if (!connectionString) {
  console.error('CRITICAL: Database connection string not found. Please set POSTGRES_URL, DATABASE_URL, or DB_DATABASE_URL_UNPOOLED.');
  // Log available keys for debugging (masking values)
  const availableKeys = Object.keys(process.env).filter(k => k.includes('DB_') || k.includes('POSTGRES') || k.includes('DATABASE'));
  console.error('Available env vars (keys only):', availableKeys);
}

export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: (process.env.NODE_ENV === 'production' || connectionString?.includes('vercel-storage') || connectionString?.includes('neon.tech')) ? { rejectUnauthorized: false } : undefined,
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
