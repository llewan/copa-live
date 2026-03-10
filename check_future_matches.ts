
import { pool } from './server/db';

async function checkFutureMatches() {
  const today = new Date().toISOString().split('T')[0];
  const res = await pool.query('SELECT COUNT(*) FROM matches WHERE match_date > $1', [today]);
  console.log('Future matches count:', res.rows[0].count);
  
  const matches = await pool.query('SELECT match_date, home_team, away_team FROM matches WHERE match_date > $1 LIMIT 5', [today]);
  console.log('Sample future matches:', matches.rows);
  
  await pool.end();
}

checkFutureMatches();
