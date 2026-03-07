
import dotenv from 'dotenv';
import { apiFootballClient } from '../server/services/providers/api-football/client.js';
import { ApiFootballFixture } from '../server/services/providers/api-football/types.js';

dotenv.config();

// Ensure API Key
if (!process.env.API_FOOTBALL_KEY) {
    console.error('CRITICAL: API_FOOTBALL_KEY not found in env.');
    process.exit(1);
}

async function fetchNextGames() {
    console.log('--- Fetching Next 10 Upcoming Games ---');

    try {
        // Fetch matches for today and tomorrow instead of using 'next' parameter (which is paid-only)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        console.log(`Fetching games for ${todayStr} and ${tomorrowStr}...`);
        
        const responseToday = await apiFootballClient.getFixturesByDate(todayStr);
        let allMatches: ApiFootballFixture[] = [...responseToday.response];
        
        // If we have less than 10 matches for today, fetch tomorrow
        if (allMatches.length < 10) {
             const responseTomorrow = await apiFootballClient.getFixturesByDate(tomorrowStr);
             allMatches = [...allMatches, ...responseTomorrow.response];
        } else {
             // We have enough matches, but are they "upcoming"?
             const now = new Date();
             const upcomingToday = allMatches.filter((m: ApiFootballFixture) => new Date(m.fixture.date).getTime() > now.getTime());
             if (upcomingToday.length < 10) {
                 const responseTomorrow = await apiFootballClient.getFixturesByDate(tomorrowStr);
                 allMatches = [...allMatches, ...responseTomorrow.response];
             }
        }
        
        // Sort by date/time
        allMatches.sort((a: ApiFootballFixture, b: ApiFootballFixture) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
        
        // Take next 10
        const now = new Date();
        const nextMatches = allMatches.filter((m: ApiFootballFixture) => new Date(m.fixture.date).getTime() > now.getTime()).slice(0, 10);
        
        console.log(`\nFound ${nextMatches.length} upcoming matches:\n`);
        
        nextMatches.forEach((fixture: ApiFootballFixture, index: number) => {
            const date = new Date(fixture.fixture.date).toLocaleString();
            const home = fixture.teams.home.name;
            const away = fixture.teams.away.name;
            const league = fixture.league.name;
            const country = fixture.league.country;
            
            console.log(`${index + 1}. [${date}] ${home} vs ${away} (${league} - ${country})`);
        });

        console.log('\n--- Done ---');
        
    } catch (err) {
        console.error('❌ Error fetching games:', err);
    }
}

fetchNextGames();
