import { Router, Request, Response } from 'express';
import { footballService } from '../services/footballService.js';

const router = Router();

// POST /api/matches/sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    await footballService.syncLiveMatches();
    res.json({ success: true, message: 'Live match sync triggered' });
  } catch (error) {
    console.error('Error in POST /api/matches/sync:', error);
    res.status(500).json({ success: false, error: 'Failed to sync live matches' });
  }
});

// GET /api/matches/upcoming
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const teams = req.query.teams as string;
    if (!teams) {
      res.json({ success: true, data: [], timestamp: new Date().toISOString() });
      return;
    }
    
    const teamList = teams.split(',').map(t => t.trim());
    const matches = await footballService.getUpcomingMatches(teamList);
    
    res.json({
      success: true,
      data: matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/matches/upcoming:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming matches' });
  }
});

// GET /api/matches
router.get('/', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const matches = await footballService.getMatches(date);
    res.json({
      success: true,
      data: matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid match ID' });
      return;
    }
    const match = await footballService.getMatchDetails(id);
    if (!match) {
      res.status(404).json({ success: false, error: 'Match not found' });
      return;
    }
    res.json({
      success: true,
      data: match,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error in GET /api/matches/${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch match details' });
  }
});

export default router;
