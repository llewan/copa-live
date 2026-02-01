I will implement the "Smart Live Polling" strategy to optimize updates and ensure data integrity for live and finished matches.

**Implementation Plan:**

1.  **Modify `footballService.ts`**:
    *   Update `getMatches` to prioritize `getLiveMatches()` when the date is today.
    *   **Live Updates**:
        *   Fetch live matches (which include events/goals).
        *   Update the database immediately with scores, minutes, and events.
    *   **"Just Finished" Handling (Game Over)**:
        *   Identify matches that are `IN_PLAY` in the database but missing from the live feed.
        *   For these specific matches:
            1.  Fetch the full day's schedule from the Secondary API to find the match and its API-Football ID.
            2.  **Crucial Step**: Call `getMatchDetails(id)` for the finished match to ensure we fetch the **final goal events** and scorers.
            3.  Update the database with the final `FINISHED` status, score, and complete list of goal scorers.
    *   **Optimization**: Skip the routine "fetch all matches" call if we are successfully polling live data, significantly reducing API load while keeping "Live" matches accurate.

2.  **Verify**:
    *   Ensure `IN_PLAY` matches update in real-time.
    *   Ensure matches transition to `FINISHED` correctly.
    *   Verify that final goal scorers are saved when the match ends.

This approach satisfies all requirements: prioritizing live matches, fetching specific states, and guaranteeing goal data is saved upon completion.