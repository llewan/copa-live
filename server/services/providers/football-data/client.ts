import fetch, { RequestInit } from 'node-fetch';
import { CONFIG } from './config.js';

export class APIError extends Error {
  constructor(public status: number, public message: string, public data?: unknown) {
    super(message);
    this.name = 'APIError';
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BaseClient {
  private token: string;
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = fetch) {
    this.token = CONFIG.API_TOKEN;
    this.baseUrl = CONFIG.BASE_URL;
    this.fetchImpl = fetchImpl;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}, retries = CONFIG.MAX_RETRIES): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Auth-Token': this.token,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await this.fetchImpl(url, {
        ...options,
        headers,
        timeout: CONFIG.TIMEOUT,
      });

      if (response.status === 429) {
        // Rate limited
        if (retries > 0) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (CONFIG.MAX_RETRIES - retries + 1);
          console.warn(`Rate limited. Retrying in ${delay}ms...`);
          await wait(delay);
          return this.request<T>(endpoint, options, retries - 1);
        }
      }

      if (!response.ok) {
        if (retries > 0 && response.status >= 500) {
           // Server error, retry
           console.warn(`Server error ${response.status}. Retrying...`);
           await wait(1000);
           return this.request<T>(endpoint, options, retries - 1);
        }
        
        const errorText = await response.text();
        throw new APIError(response.status, `API Request Failed: ${response.statusText}`, errorText);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof APIError) throw error;
      
      // Network errors
      if (retries > 0) {
        console.warn(`Network error: ${(error as Error).message}. Retrying...`);
        await wait(1000);
        return this.request<T>(endpoint, options, retries - 1);
      }
      
      throw new APIError(0, `Network Error: ${(error as Error).message}`);
    }
  }
}
