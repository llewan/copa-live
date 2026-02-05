import { pool } from './db.js';

const migrate = async () => {
  try {
    console.log('Migrating database: creating daily_sync_status table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_sync_status (
        date VARCHAR(20) PRIMARY KEY,
        status VARCHAR(20) NOT NULL, -- 'synced', 'failed', 'pending'
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migration completed: daily_sync_status table created.');
  } catch (e) {
    console.error('Migration failed', e);
  }
};

migrate().then(() => pool.end());
