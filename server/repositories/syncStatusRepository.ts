import { pool } from '../db.js';

export const syncStatusRepository = {
  async getStatus(date: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT status FROM daily_sync_status WHERE date = $1',
        [date]
      );
      return result.rows.length > 0 ? result.rows[0].status : null;
    } catch (error) {
      console.error('[SyncStatusRepository] Error getting status:', error);
      return null;
    }
  },

  async markAsSynced(date: string) {
    try {
      await pool.query(
        `INSERT INTO daily_sync_status (date, status, updated_at)
         VALUES ($1, 'synced', CURRENT_TIMESTAMP)
         ON CONFLICT(date) DO UPDATE SET
           status = 'synced',
           updated_at = CURRENT_TIMESTAMP
        `,
        [date]
      );
    } catch (error) {
      console.error('[SyncStatusRepository] Error marking as synced:', error);
    }
  }
};
