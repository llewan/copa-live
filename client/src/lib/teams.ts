export interface TeamInfo {
  id: number;
  name: string;
  shortName: string;
  code?: string;
  crest?: string;
  league: string;
  color: string;
}

export const TEAMS: TeamInfo[] = [
  { id: 86, name: 'Real Madrid', shortName: 'Real Madrid', code: 'RMA', league: 'Champions League', color: 'bg-white' },
  { id: 81, name: 'FC Barcelona', shortName: 'Barça', code: 'FCB', league: 'Champions League', color: 'bg-blue-800' },
  { id: 65, name: 'Manchester City', shortName: 'Man City', code: 'MCI', league: 'Premier League', color: 'bg-sky-500' },
  { id: 64, name: 'Liverpool', shortName: 'Liverpool', code: 'LIV', league: 'Premier League', color: 'bg-red-700' },
  { id: 57, name: 'Arsenal', shortName: 'Arsenal', code: 'ARS', league: 'Premier League', color: 'bg-red-600' },
  { id: 66, name: 'Manchester United', shortName: 'Man Utd', code: 'MUN', league: 'Premier League', color: 'bg-red-700' },
  { id: 524, name: 'Paris Saint Germain', shortName: 'PSG', code: 'PSG', league: 'Champions League', color: 'bg-blue-900' },
  { id: 5, name: 'Bayern Munich', shortName: 'Bayern', code: 'BAY', league: 'Champions League', color: 'bg-red-700' },
  { id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', code: 'BVB', league: 'Champions League', color: 'bg-yellow-400' },
  { id: 109, name: 'Juventus', shortName: 'Juventus', code: 'JUV', league: 'Champions League', color: 'bg-black' },
  { id: 98, name: 'AC Milan', shortName: 'Milan', code: 'ACM', league: 'Champions League', color: 'bg-red-700' },
  { id: 108, name: 'Inter', shortName: 'Inter', code: 'INT', league: 'Champions League', color: 'bg-blue-700' },
  { id: 78, name: 'Atletico Madrid', shortName: 'Atleti', code: 'ATM', league: 'Champions League', color: 'bg-red-700' },
];
