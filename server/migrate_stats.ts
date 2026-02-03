import { pool } from './db.js';

const migrate = async () => {
  try {
    console.log('Migrating database...');
    
    // Add venue column
    try {
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS venue VARCHAR(255)');
        console.log('Added venue column');
    } catch {
        console.log('venue column might already exist');
    }

    // Add statistics column (JSONB)
    try {
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS statistics JSONB DEFAULT \'[]\'');
        console.log('Added statistics column');
    } catch {
        console.log('statistics column might already exist');
    }

    console.log('Migration completed');
  } catch (e) {
    console.error('Migration failed', e);
  }
};

migrate().then(() => pool.end());
