import { Match, MatchDetail } from '@/types';

const API_BASE_URL = '/api';

// --- Types ---
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

// --- Auth API ---
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const register = async (email: string, password: string, username?: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  return response.json();
};

export const getMe = async (token: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// --- Matches API ---
export const getMatches = async (date?: string): Promise<Match[]> => {
  const url = date ? `${API_BASE_URL}/matches?date=${date}` : `${API_BASE_URL}/matches`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }
  const json = await response.json();
  return json.data;
};

export const getMatchDetails = async (id: string): Promise<MatchDetail> => {
  const response = await fetch(`${API_BASE_URL}/matches/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch match details');
  }
  const json = await response.json();
  return json.data;
};
