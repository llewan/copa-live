# Implementation Plan: League Control and Filtering System

## 1. Database Schema Updates
We will modify `api/init_db.ts` to include two new tables:
- **`allowed_leagues`**: Stores the configuration of permitted competitions.
  - Columns: `id`, `name`, `football_data_id` (for Football-Data.org), `api_football_id` (for API-Football).
  - **Seed Data**:
    - Premier League (England): FD: 2021, AF: 39
    - UEFA Champions League: FD: 2001, AF: 2
    - LaLiga (Spain): FD: 2014, AF: 140
    - Ligue 1 (France): FD: 2015, AF: 61
- **`audit_logs`**: Tracks system access and configuration changes.
  - Columns: `id`, `action`, `details`, `timestamp`.

## 2. New Backend Services
- **`api/services/leagueService.ts`**:
  - Responsible for fetching the "Authorized Configuration" from the database.
  - Provides the whitelist of league IDs for both providers.
- **`api/services/auditService.ts`**:
  - Handles logging of significant events (e.g., "Matches Fetched", "Configuration Updated").

## 3. Adapter Enhancements
We will refactor the existing adapters to enforce the league restrictions at the source or immediately after fetching:
- **`FootballDataOrgAdapter`**: Update to accept a dynamic list of `competitionIds` from the `LeagueService` instead of using a hardcoded list.
- **`ApiFootballComAdapter`**: Update to filter results based on the allowed `api_football_id`s. Since the API returns all matches for a day, we will strictly filter the response to ensure only authorized leagues are passed to the application.

## 4. Integration in `FootballService`
- Inject `LeagueService` and `AuditService` into `FootballService`.
- **Workflow**:
  1.  `getMatches` is called.
  2.  `AuditService` logs the access request.
  3.  `LeagueService` provides the current whitelist.
  4.  Adapters are invoked with the specific whitelist.
  5.  Results are double-checked (filtered) to ensure compliance.
  6.  Only matches from the 4 allowed leagues are returned to the frontend.

## 5. Verification
- Verify that only the 4 specified leagues appear on the dashboard.
- Verify that `audit_logs` table is being populated.
- Ensure real-time data from "Secondary API" (API-Football) is correctly filtered.
