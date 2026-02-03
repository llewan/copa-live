import { Match, MatchDetail } from '../../interfaces.js';
import { ApiFootballFixture } from './types.js';

export const mapStatus = (shortStatus: string): string => {
  // Mapping API-Football short status codes to our Domain Status
  // TBD: Time To Be Defined
  // NS: Not Started
  // 1H: First Half, Kick Off
  // HT: Halftime
  // 2H: Second Half, 2nd Half Started
  // ET: Extra Time
  // BT: Break Time
  // P: Penalty In Progress
  // SUSP: Match Suspended
  // INT: Match Interrupted
  // FT: Match Finished
  // AET: Match Finished After Extra Time
  // PEN: Match Finished After Penalty
  // PST: Match Postponed
  // CAN: Match Cancelled
  // ABD: Match Abandoned
  // AWD: Technical Loss
  // WO: WalkOver

  const map: Record<string, string> = {
    'NS': 'SCHEDULED',
    'TBD': 'SCHEDULED',
    '1H': 'IN_PLAY',
    'HT': 'PAUSED',
    '2H': 'IN_PLAY',
    'ET': 'IN_PLAY',
    'BT': 'PAUSED',
    'P': 'IN_PLAY',
    'SUSP': 'SUSPENDED',
    'INT': 'SUSPENDED',
    'FT': 'FINISHED',
    'AET': 'FINISHED',
    'PEN': 'FINISHED',
    'PST': 'POSTPONED',
    'CAN': 'CANCELED',
    'ABD': 'CANCELED',
    'AWD': 'FINISHED',
    'WO': 'CANCELED'
  };

  return map[shortStatus] || 'SCHEDULED';
};

const normalizeEventType = (type: string, detail: string): string => {
  if (type === 'Goal') return 'GOAL';
  if (type === 'Card') {
     if (detail && detail.includes('Yellow')) return 'YELLOW_CARD';
     if (detail && detail.includes('Red')) return 'RED_CARD';
     return 'CARD';
  }
  if (type === 'subst') return 'SUBSTITUTION';
  return type.toUpperCase();
};

export const mapFixtureToMatch = (fixture: ApiFootballFixture): Match => {
  const events = fixture.events?.map(e => ({
    type: normalizeEventType(e.type, e.detail),
    minute: e.time.elapsed + (e.time.extra || 0),
    team: { name: e.team.name },
    player: { name: e.player.name }
  })) || [];

  const homeStats = fixture.statistics?.find(s => s.team.id === fixture.teams.home.id)?.statistics || [];
  const awayStats = fixture.statistics?.find(s => s.team.id === fixture.teams.away.id)?.statistics || [];

  const statistics = homeStats.map(h => {
      const a = awayStats.find(as => as.type === h.type);
      return {
          type: h.type,
          home: h.value || 0,
          away: a?.value || 0
      };
  });

  return {
    id: fixture.fixture.id,
    utcDate: fixture.fixture.date,
    status: mapStatus(fixture.fixture.status.short),
    minute: fixture.fixture.status.elapsed,
    homeTeam: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      crest: fixture.teams.home.logo,
    },
    awayTeam: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      crest: fixture.teams.away.logo,
    },
    score: {
      fullTime: {
        home: fixture.goals.home,
        away: fixture.goals.away,
      },
    },
    competition: {
      id: fixture.league.id,
      name: fixture.league.name,
      emblem: fixture.league.logo,
    },
    stage: fixture.league.round,
    group: null, // API-Football league object usually doesn't have group explicitly in this view, maybe in round string
    events,
    provider: 'api-football',
    venue: fixture.fixture.venue.name || undefined,
    statistics: statistics.length > 0 ? statistics : undefined
  };
};

export const mapFixtureToMatchDetail = (fixture: ApiFootballFixture): MatchDetail => {
  const match = mapFixtureToMatch(fixture);
  
  return {
    ...match,
    events: match.events || [],
    statistics: match.statistics || []
  };
};
