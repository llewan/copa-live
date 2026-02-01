I will update the polling intervals in the frontend components to **5 minutes** (300,000ms) as requested. This will significantly reduce the load on your API quota.

**Proposed Changes:**

1.  **`src/pages/Dashboard.tsx`**: Increase polling from **90 seconds** to **5 minutes**.
    *   Current: `setInterval(fetchData, 90000)`
    *   New: `setInterval(fetchData, 300000)`

2.  **`src/pages/MatchDetail.tsx`**: Increase polling from **30 seconds** to **5 minutes**.
    *   Current: `setInterval(fetchData, 30000)`
    *   New: `setInterval(fetchData, 300000)`

**Note:**
I did not find any automatic background synchronization loop on the backend (e.g., cron jobs) that calls the external API directly. The system currently relies on these frontend polling intervals to trigger updates (or manual syncs). Reducing these intervals will directly reduce the frequency of checks.

**Verification:**
After the update, I will verify the changes by checking the file content and ensuring the application builds correctly.