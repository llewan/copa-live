import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  BASE_URL: 'https://api.football-data.org/v4',
  get API_TOKEN() {
    const token = process.env.FOOTBALL_DATA_ORG_TOKEN;
    if (!token) {
      console.warn('FOOTBALL_DATA_ORG_TOKEN not found in environment variables');
    }
    return token || '';
  },
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
};
