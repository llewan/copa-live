export interface Competition {
  id: number;
  area: {
    id: number;
    name: string;
    code: string;
    flag: string | null;
  };
  name: string;
  code: string;
  type: string;
  emblem: string | null;
  plan: string;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
    winner: unknown | null;
  };
  numberOfAvailableSeasons: number;
  lastUpdated: string;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  runningCompetitions: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  }[];
  coach: {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    dateOfBirth: string;
    nationality: string;
    contract: {
      start: string;
      until: string;
    };
  };
  squad: {
    id: number;
    name: string;
    position: string;
    dateOfBirth: string;
    nationality: string;
  }[];
  lastUpdated: string;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: string | null;
    duration: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  };
}

export interface StandingsItem {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingsTable {
  stage: string;
  type: string;
  group: string | null;
  table: StandingsItem[];
}

export interface MatchesResponse {
  filters: Record<string, unknown>;
  resultSet: Record<string, unknown>;
  matches: Match[];
}

export interface CompetitionsResponse {
    count: number;
    filters: Record<string, unknown>;
    competitions: Competition[];
}

export interface StandingsResponse {
    filters: Record<string, unknown>;
    area: unknown;
    competition: unknown;
    season: unknown;
    standings: StandingsTable[];
}
