import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use POSTGRES_URL from environment variables (standard for Vercel Postgres)
// or fallback to individual vars if needed (but usually POSTGRES_URL is enough)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Database connection string not found. Please set POSTGRES_URL or DATABASE_URL environment variable.');
}

export const pool = new Pool({
  connectionString,
  ssl: (process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL) ? { rejectUnauthorized: false } : undefined,
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
