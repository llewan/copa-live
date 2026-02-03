import { Router, Request, Response, NextFunction } from 'express';
import { footballService } from '../services/footballService.js';
import { matchRepository } from '../repositories/matchRepository.js';
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

// Daily Sync: Loads schedule for the day and next 10 days
// Schedule: 06:00 AM UTC (or similar)
router.get('/daily', validateCronSecret, async (_req: Request, res: Response) => {
  try {
    console.log('[Cron] Starting Daily Sync...');
    const today = new Date().toISOString().split('T')[0];
    
    // We force a fetch from the Primary provider for the schedule
    // getMatches has logic to fetch if DB is empty, but we might want to force refresh?
    // Currently getMatches(date) returns DB if exists.
    // We might need a method to force refresh.
    // However, the daily sync usually runs when the new day starts, so DB might be empty for that day if we didn't look ahead.
    // But footballService.getMatches logic is: "If DB empty, fetch 10 days".
    // So calling getMatches(today) is enough to trigger the 10-day fetch if it's missing.
    // If it's NOT missing, we might want to ensure it's up to date.
    
    // Let's rely on getMatches for now, as it handles the "Fetch 10 days" logic.
    const matches = await footballService.getMatches(today);
    
    auditService.log('cron_daily', `Daily sync completed. Matches: ${matches.length}`);
    res.json({ success: true, message: 'Daily sync completed', count: matches.length });
  } catch (error) {
    console.error('[Cron] Daily sync failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Live Sync: Updates live scores
// Schedule: Every 10 minutes
router.get('/live', validateCronSecret, async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Optimization: Check if we actually NEED to poll
    // 1. Get active matches from DB
    const matchesNeedingUpdate = await matchRepository.getMatchesNeedingUpdates(today);
    
    const now = new Date();
    // Look for matches starting within 20 mins (buffer) or currently active
    const activeMatches = matchesNeedingUpdate.filter(m => {
        const matchDate = new Date(m.utcDate);
        const isLive = ['IN_PLAY', 'PAUSED', 'HALFTIME', 'LIVE', '1H', '2H', 'ET', 'P', 'BT', 'INT'].includes(m.status);
        
        // 20 minutes lookahead to catch pre-match updates
        const timeDiff = matchDate.getTime() - now.getTime();
        const isStartingSoon = m.status === 'SCHEDULED' && timeDiff <= 20 * 60 * 1000 && timeDiff > -120 * 60 * 1000; // -120 means it started 2 hours ago (should be live, but if status is stuck on SCHEDULED)

        return isLive || isStartingSoon;
    });

    if (activeMatches.length === 0) {
      // No active matches, skip expensive logic
      console.log('[Cron] No active matches found. Skipping Live Sync.');
      return res.json({ success: true, message: 'Skipped: No active matches', active_count: 0 });
    }

    console.log(`[Cron] Found ${activeMatches.length} active matches. Triggering Sync...`);
    
    // Execute Sync
    await footballService.syncLiveMatches();
    
    auditService.log('cron_live', `Live sync completed. Active matches: ${activeMatches.length}`);
    res.json({ success: true, message: 'Live sync executed', active_count: activeMatches.length });
  } catch (error) {
    console.error('[Cron] Live sync failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export const cronRoutes = router;
