# CopaLive - Real-time Football Results

A modern web application to visualize real-time football results, stats, and events for the FIFA World Cup 2026.

## Features

- **Real-time Dashboard**: Live scores, match status, and minute updates.
- **Match Details**: Comprehensive statistics, events (goals, cards), and lineups.
- **Filtering**: Filter matches by status (Live, Scheduled, Finished).
- **Responsive Design**: Optimized for mobile, tablet, and desktop.
- **Hybrid Data**: Combines data from API-Football and Football-Data.org.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons (Vite)
- **Backend**: Node.js, Express (Vercel Serverless Functions)
- **Database**: PostgreSQL (Vercel Postgres)
- **External API**: API-Football (api-football.com) / Football-Data.org

## Setup Instructions

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL Database (e.g., Vercel Postgres, Supabase, or local)

### 2. Installation

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
POSTGRES_URL=postgres://user:password@host:port/database?sslmode=require
# Get your free key at https://dashboard.api-football.com/
API_FOOTBALL_KEY=your_api_sports_key_here
FOOTBALL_DATA_KEY=your_football_data_key_here
```

### 4. Database Setup

Initialize the database tables:

```bash
npx tsx api/init_db.ts
```

### 5. Running the Application

Start both the frontend and backend in development mode:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Deployment

This project is configured for deployment on Vercel.

1. Push to GitHub.
2. Import project in Vercel.
3. Add Environment Variables (`POSTGRES_URL`, `API_FOOTBALL_KEY`, etc.).
4. Vercel will handle the build and deployment.

## Project Structure

- `client/`: Frontend React application.
- `api/`: Backend Express application (Serverless).
- `api/services/`: External API integration and logic.
- `api/init_db.ts`: Database initialization script.
