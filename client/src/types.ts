export interface Team {
  id: number;
  name: string;
  crest: string;
  shortName?: string;
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
  | 'CANCELED'
  | string;

export interface MatchEvent {
  type: string;
  minute: number;
  team: { name: string };
  player: { name: string };
}

export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  minute: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  competition: Competition;
  stage: string;
  group: string | null;
  provider?: 'football-data' | 'api-football';
  lastUpdated?: string;
  venue?: string;
  events?: MatchEvent[];
}

export interface MatchDetail extends Match {
  events: Array<{
    type: string;
    minute: number;
    team: { name: string };
    player: { name: string };
  }>;
  statistics: Array<{
    type: string;
    home: string | number;
    away: string | number;
  }>;
}
