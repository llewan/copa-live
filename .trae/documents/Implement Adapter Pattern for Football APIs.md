I will implement the Adapter pattern to integrate the `api-football` service alongside the existing `football-data` service.

### 1. Structure & Interfaces
- Create `api/services/providers/` to house the adapters.
- Define `IFootballProvider` in `api/services/interfaces.ts` with methods:
  - `getMatches(date: string): Promise<Match[]>`
  - `getMatchDetails(id: string | number): Promise<MatchDetail>`
  - `getLiveMatches(): Promise<Match[]>`
- Normalize domain models (`Match`, `MatchDetail`) into a shared types file.

### 2. Adapters Implementation
- **Refactor `football-data`**:
  - Move existing logic to `api/services/providers/football-data/`.
  - Create `FootballDataOrgAdapter` implementing `IFootballProvider`.
- **Create `api-football`**:
  - Create `api/services/providers/api-football/` structure.
  - Implement `ApiFootballClient` to handle HTTP requests to `v3.football.api-football.com`.
  - Implement `ApiFootballComAdapter` with rate limiting (100 req/day) and mapping logic.

### 3. Factory & Strategy (The "Mapping Object")
- Create `api/services/footballService.ts` to replace `footballData.ts`.
- Implement a selection strategy:
  - **Live/Today**: Use `ApiFootballComAdapter`.
  - **Historical/Scheduled**: Use `FootballDataOrgAdapter`.
- Implement fallback logic: If the primary adapter fails (or rate limit hit), try the secondary one.

### 4. Database & Persistence
- Update `api/repositories/matchRepository.ts` and `api/init_db.ts` to support a `provider` column (migration).
- Note: Potential ID conflict risk between APIs will be mitigated by prioritizing the primary provider for each use case.

### 5. Testing
- Add unit tests for `ApiFootballComAdapter`.
- Add unit tests for the `FootballService` strategy logic.

### 6. Integration
- Update `api/routes/matches.ts` to use the new `footballService`.
- Ensure environment variables are set up (I will add a placeholder for `API_FOOTBALL_COM_TOKEN`).