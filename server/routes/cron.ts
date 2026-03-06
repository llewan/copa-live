import { Router, Request, Response, NextFunction } from 'express';
import { footballService } from '../services/footballService.js';
import { auditService } from '../services/auditService.js';

const router = Router();

// Helper to validate Cron Secret
const validateCronSecret = (req: Request, res: Response, next: NextFunction) => {
  // Vercel automatically injects this header for configured cron jobs
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, we must validate it
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    // Warn if no secret is configured (dev mode or insecure)
    console.warn('[Cron] Warning: CRON_SECRET not configured. Endpoint is public.');
  }
  
  next();
};

// Daily Sync: Loads schedule for the day and next 7 days
// Schedule: 06:00 AM UTC (or similar)
router.get('/daily', validateCronSecret, async (_req: Request, res: Response) => {
  try {
    console.log('[Cron] Starting Daily Sync...');
    const today = new Date().toISOString().split('T')[0];
    
    // We force a sync of the schedule for the next 7 days
    await footballService.syncUpcomingSchedule(today);
    
    auditService.log('cron_daily', `Daily sync completed for ${today} + 7 days.`);
    res.json({ success: true, message: 'Daily sync completed' });
  } catch (error) {
    console.error('[Cron] Daily sync failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Live Sync: DEPRECATED - We use on-demand sync now to save quota
router.get('/live', validateCronSecret, async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Live sync cron is deprecated. Using on-demand sync.' });
});

export const cronRoutes = router;
