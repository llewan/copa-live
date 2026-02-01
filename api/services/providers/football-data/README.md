# Football Data API Client

This module provides a fully functional client for the [football-data.org](https://www.football-data.org/) API.

## Features

- **Authentication**: Automatically handles the `X-Auth-Token` header.
- **Modular Design**: Separated into client, types, config, and mappers.
- **Error Handling**: Handles 429 Rate Limits (with automatic retry) and network errors.
- **Type Safety**: Full TypeScript definitions for API responses.

## Setup

1.  Ensure you have the API token in your `.env` file:
    ```
    FOOTBALL_DATA_ORG_TOKEN=8fee0ba472a1455e9044735cf8b963a7
    ```

2.  Import the client:
    ```typescript
    import { footballDataClient } from './api/services/football-data/index.js';
    ```

## Usage

### Fetching Competitions
```typescript
const competitions = await footballDataClient.getCompetitions();
```

### Fetching Matches
```typescript
// Fetch matches for a date range
const matches = await footballDataClient.getMatches('2023-01-01', '2023-01-07');

// Fetch matches for a specific competition
const plMatches = await footballDataClient.getMatches(undefined, undefined, 2021); // 2021 = Premier League
```

### Fetching Standings
```typescript
const standings = await footballDataClient.getStandings(2021);
```

### Data Mapping
Use the `mapMatchToDomain` helper to transform the raw API response into a simplified domain model if needed.

```typescript
import { mapMatchToDomain } from './api/services/football-data/index.js';

const rawMatch = await footballDataClient.getMatch(123456);
const domainMatch = mapMatchToDomain(rawMatch);
```

## Testing

Run the tests using:
```bash
npx tsx --test api/services/football-data/__tests__/client.test.ts
```
