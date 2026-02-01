// Map of team names to stadiums
const STADIUMS: Record<string, string> = {
  'Real Madrid': 'Santiago Bernabéu',
  'FC Barcelona': 'Spotify Camp Nou',
  'Manchester City': 'Etihad Stadium',
  'Liverpool': 'Anfield',
  'Arsenal': 'Emirates Stadium',
  'Manchester United': 'Old Trafford',
  'Paris Saint Germain': 'Parc des Princes',
  'Bayern Munich': 'Allianz Arena',
  'Borussia Dortmund': 'Signal Iduna Park',
  'Juventus': 'Allianz Stadium',
  'AC Milan': 'San Siro',
  'Inter': 'San Siro',
  'Atletico Madrid': 'Cívitas Metropolitano',
};

export const getStadiumForTeam = (teamName: string): string | undefined => {
  return STADIUMS[teamName];
};
