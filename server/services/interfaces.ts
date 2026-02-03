export interface Team {
  id: number;
  name: string;
  crest: string;
}

export interface Score {
  fullTime: {
    home: number | null;
    away: number | null;
  };
}

export interface Competition {
  id: number;
  name: string;
  emblem: string | null;
}

export type MatchStatus = 
  | 'SCHEDULED' 
  | 'LIVE' 
  | 'IN_PLAY' 
  | 'PAUSED' 
  | 'FINISHED' 
  | 'POSTPONED' 
  | 'SUSPENDED' 
  | 'CANCELED';

export interface MatchEvent {
  type: string;
  minute: number;
  team: { name: string };
  player: { name: string };
}

export interface MatchStatistic {
  type: string;
  home: string | number;
  away: string | number;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string; // Keeping as string to allow flexibility, but conceptually MatchStatus
  minute: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  competition: Competition;
  stage: string;
  group: string | null;
  provider?: 'football-data' | 'api-football';
  lastUpdated?: string;
  events?: MatchEvent[];
  venue?: string;
  statistics?: MatchStatistic[];
}

export interface MatchDetail extends Match {
  events: MatchEvent[];
  statistics: MatchStatistic[];
}

export interface IFootballProvider {
  name: string;
  getMatches(date: string): Promise<Match[]>;
  getMatchesRange(from: string, to: string): Promise<Match[]>;
  getMatchDetails(id: number): Promise<MatchDetail>;
  getLiveMatches(): Promise<Match[]>;
}
