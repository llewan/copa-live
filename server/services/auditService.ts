import { pool } from '../db.js';

export class AuditService {
  async log(action: string, details: string) {
    try {
      // In a real app, you might want to log user ID too if available
      // Using fire-and-forget approach so it doesn't block the main flow
      // But SQLite needs to be careful with concurrency, though WAL mode helps.
      // pool.query handles it.
      await pool.query(
        'INSERT INTO audit_logs (action, details) VALUES ($1, $2)',
        [action, details]
      );
    } catch (error) {
      console.error('[AuditService] Error logging action:', error);
    }
  }

  async getLastSyncTime(action: string): Promise<Date | null> {
    try {
      const result = await pool.query(
        'SELECT timestamp FROM audit_logs WHERE action = $1 ORDER BY timestamp DESC LIMIT 1',
        [action]
      );
      
      if (result.rows.length === 0) return null;
      return new Date(result.rows[0].timestamp);
    } catch (error) {
      console.error('[AuditService] Error getting last sync time:', error);
      return null;
    }
  }
}

export const auditService = new AuditService();
