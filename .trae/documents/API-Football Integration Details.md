# API-Football Integration Details

## Overview

We use [API-Football (v3)](https://www.api-football.com/documentation-v3) as our primary data source for match fixtures, live scores, and details.

## Fixtures Endpoint Strategy

### Endpoint: `/fixtures`

We use the `GET /fixtures` endpoint to fetch match schedules.

### Constraints & Limitations

1.  **Global Date Range Queries**:
    - The API does **not** allow querying a date range (`from` and `to` parameters) without specifying a `league` or `season`.
    - Error message: `The From field need another parameter.` / `The To field need another parameter.`

2.  **`next` Parameter**:
    - The `next` parameter (e.g., `fixtures?next=10`) is **not available on the Free plan**.
    - Error message: `Free plans do not have access to the Next parameter.`

3.  **Rate Limits**:
    - The Free plan allows 100 requests per day.
    - We must be efficient with our calls.

### Our Implementation Strategy

To fetch the upcoming schedule for multiple leagues efficiently without making N requests (where N = number of leagues), we use a **Date-based Iteration Strategy**:

1.  **Iterate by Date**:
    - We loop through each date in the desired range (e.g., Today + 7 days).
    - For each date, we call `GET /fixtures?date=YYYY-MM-DD`.
    - This returns **all** matches globally for that specific day.

2.  **Client-Side Filtering**:
    - We filter the returned matches by our configured `allowedLeagueIds`.
    - This allows us to support any number of leagues with a fixed number of API calls (1 call per day synced).

3.  **Why this is optimal for us**:
    - If we sync 7 days, we make 7 API calls.
    - If we have 20 leagues and used the `league` parameter with `from/to`, we would make 20 API calls.
    - Since 7 < 20, iterating by date saves quota.

### Code References

- **Client**: `server/services/providers/api-football/client.ts` - `getFixturesByDate(date)`
- **Adapter**: `server/services/providers/api-football/adapter.ts` - `getMatchesRange(from, to)` implements the date loop.
- **Service**: `server/services/footballService.ts` - `syncUpcomingSchedule` orchestrates the sync.
