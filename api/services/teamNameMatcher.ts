
import { distance } from 'fastest-levenshtein';

export class TeamNameMatcher {
  private static readonly ALIASES: Record<string, string> = {
    // English Premier League
    'man united': 'manchester united',
    'man utd': 'manchester united',
    'man city': 'manchester city',
    'wolves': 'wolverhampton wanderers',
    'spurs': 'tottenham hotspur',
    'newcastle': 'newcastle united',
    'leicester': 'leicester city',
    'leeds': 'leeds united',
    'norwich': 'norwich city',
    'nottm forest': 'nottingham forest',
    'sheffield utd': 'sheffield united',
    'brighton': 'brighton & hove albion',
    'west ham': 'west ham united',
    
    // La Liga
    'atletico': 'atletico madrid',
    'atleti': 'atletico madrid',
    'betis': 'real betis',
    'celta': 'celta vigo',
    'real sociedad': 'real sociedad', // sometimes just 'sociedad'
    'athletic': 'athletic club',
    'athletic bilbao': 'athletic club',
    'barca': 'barcelona',
    
    // Serie A
    'inter': 'inter milan',
    'internazionale': 'inter milan',
    'milan': 'ac milan',
    
    // Bundesliga
    'bayern': 'bayern munich',
    'bayern munchen': 'bayern munich',
    'bayer': 'bayer leverkusen',
    'leverkusen': 'bayer leverkusen',
    'gladbach': 'borussia monchengladbach',
    'monchengladbach': 'borussia monchengladbach',
    'dortmund': 'borussia dortmund',
    
    // Ligue 1
    'psg': 'paris saint germain',
    'saint etienne': 'as saint etienne',
    
    // Others
    'sporting': 'sporting cp',
    'sporting lisbon': 'sporting cp',
  };

  private static normalize(name: string): string {
    const normalized = name.toLowerCase()
      .replace(/fc|cf|football club|club|sc|sv/g, '') // Remove common club suffixes/prefixes
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars (keep spaces)
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces

    // Check aliases
    if (this.ALIASES[normalized]) {
      return this.ALIASES[normalized];
    }
    
    // Partial check for aliases (e.g. "man united fc" -> "man united" -> "manchester united")
    for (const [alias, target] of Object.entries(this.ALIASES)) {
        if (normalized === alias) return target;
    }

    return normalized;
  }

  static areTeamsSame(name1: string, name2: string): boolean {
    const n1 = this.normalize(name1);
    const n2 = this.normalize(name2);

    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Levenshtein distance check
    // Allow a small edit distance relative to string length
    const dist = distance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    
    // If strings are short (< 5), exact match or alias is required.
    // If strings are long, allow 2-3 chars difference.
    if (maxLength > 5) {
        if (dist <= 3) return true;
    }

    return false;
  }
}
