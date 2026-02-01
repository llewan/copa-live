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
}

export const auditService = new AuditService();
