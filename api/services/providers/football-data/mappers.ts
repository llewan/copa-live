import { Match as ApiMatch } from './types.js';

export interface DomainMatch {
  id: number;
  utcDate: string;
  status: string;
  minute: number | null;
  homeTeam: {
    id: number;
    name: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    crest: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  competition: {
    id: number;
    name: string;
    emblem: string | null;
  };
  stage: string;
  group: string | null;
}

export const mapStatus = (status: string): string => {
  const liveStatuses = ['IN_PLAY', 'PAUSED', 'LIVE'];
  const finishedStatuses = ['FINISHED', 'AWARDED'];
  const scheduledStatuses = ['SCHEDULED', 'TIMED'];

  if (liveStatuses.includes(status)) return 'IN_PLAY';
  if (finishedStatuses.includes(status)) return 'FINISHED';
  if (scheduledStatuses.includes(status)) return 'SCHEDULED';
  return status; // POSTPONED, SUSPENDED, CANCELED
};

const formatTeamName = (name: string, shortName: string): string => {
  // Override specific names based on user preferences or Spanish translations
  const overrides: Record<string, string> = {
    'FC Barcelona': 'Barcelona',
    'FC København': 'Copenhague',
    'Club Atlético de Madrid': 'Atlético de Madrid',
    'Bayer 04 Leverkusen': 'Bayer Leverkusen',
    'FC Bayern München': 'Bayern Múnich',
    'Paris Saint-Germain FC': 'PSG',
    'Sporting Clube de Portugal': 'Sporting CP',
    'PSV Eindhoven': 'PSV',
    'FC Porto': 'Porto',
    'SL Benfica': 'Benfica',
    'FC Internazionale Milano': 'Inter',
    'AC Milan': 'Milan',
    'AS Roma': 'Roma',
    'SSC Napoli': 'Napoli',
    'Juventus FC': 'Juventus',
    'SS Lazio': 'Lazio',
    'Real Madrid CF': 'Real Madrid',
    'Sevilla FC': 'Sevilla',
    'Real Betis Balompié': 'Betis',
    'Real Sociedad de Fútbol': 'Real Sociedad',
    'Villarreal CF': 'Villarreal',
    'Athletic Club': 'Athletic Bilbao',
    'Manchester City FC': 'Man City',
    'Manchester United FC': 'Man United',
    'Liverpool FC': 'Liverpool',
    'Chelsea FC': 'Chelsea',
    'Arsenal FC': 'Arsenal',
    'Tottenham Hotspur FC': 'Tottenham',
    'West Ham United FC': 'West Ham',
    'Newcastle United FC': 'Newcastle',
  };

  if (overrides[name]) {
    return overrides[name];
  }

  // Use shortName if available and not identical to full name, but be careful with abbreviations
  // that might be too short or obscure. Generally shortName is decent.
  if (shortName && shortName !== name && shortName.length > 3) {
      return shortName;
  }

  // Fallback: remove common prefixes/suffixes
  return name.replace(/^FC\s+/, '').replace(/\s+FC$/, '');
};

export const mapMatchToDomain = (match: ApiMatch): DomainMatch => {
  return {
    id: match.id,
    utcDate: match.utcDate,
    status: mapStatus(match.status),
    minute: null, // football-data.org doesn't provide minute in the matches list endpoint easily without paying or details
    homeTeam: {
      id: match.homeTeam.id,
      name: formatTeamName(match.homeTeam.name, match.homeTeam.shortName),
      crest: match.homeTeam.crest,
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: formatTeamName(match.awayTeam.name, match.awayTeam.shortName),
      crest: match.awayTeam.crest,
    },
    score: {
      fullTime: {
        home: match.score.fullTime.home,
        away: match.score.fullTime.away,
      },
    },
    competition: {
      id: match.competition.id,
      name: match.competition.name,
      emblem: match.competition.emblem,
    },
    stage: match.stage,
    group: match.group,
  };
};
