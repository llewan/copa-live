import fetch from 'node-fetch';
import { ApiFootballResponse } from './types.js';

const BASE_URL = 'https://v3.football.api-sports.io';

export class ApiFootballClient {
  private remainingRequests: number = 100; // Default assumption

  private getApiKey(): string {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key || key === 'YOUR_API_KEY_HERE') {
        throw new Error('API_FOOTBALL_KEY is not configured in environment variables.');
    }
    return key;
  }

  async get(endpoint: string, params: Record<string, string | number> = {}): Promise<ApiFootballResponse> {
    if (this.remainingRequests <= 0) {
      console.warn('[ApiFootballClient] Rate limit reached (client-side check).');
      // We could throw, but let's try just in case headers updated or day rolled over
      // throw new Error('Rate limit reached');
    }

    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));

    console.log(`[ApiFootballClient] Fetching: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': this.getApiKey(),
      }
    });

    // Update rate limits from headers
    const remaining = response.headers.get('x-ratelimit-requests-remaining');
    if (remaining) {
      this.remainingRequests = parseInt(remaining, 10);
      console.log(`[ApiFootballClient] Remaining requests: ${this.remainingRequests}`);
    }

    if (!response.ok) {
      if (response.status === 429) {
          this.remainingRequests = 0;
          throw new Error('Rate limit reached (429)');
      }
      throw new Error(`ApiFootball error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as ApiFootballResponse;
    
    // Check for functional errors in body
    if (Array.isArray(data.errors) && data.errors.length > 0) {
        // Sometimes errors is an array, sometimes object. v3 is usually object or array.
        // If it's empty array [] it's fine.
        console.error('[ApiFootballClient] API Errors:', data.errors);
    }
    
    return data;
  }

  async getFixturesByDate(date: string): Promise<ApiFootballResponse> {
    return this.get('/fixtures', { date });
  }

  async getLiveFixtures(): Promise<ApiFootballResponse> {
    return this.get('/fixtures', { live: 'all' });
  }

  async getFixtureById(id: number): Promise<ApiFootballResponse> {
    return this.get('/fixtures', { id });
  }
}

export const apiFootballClient = new ApiFootballClient();
