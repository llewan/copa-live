import { BaseClient } from './client.js';
import { 
  MatchesResponse, 
  CompetitionsResponse, 
  StandingsResponse, 
  Team, 
  Match, 
  Competition 
} from './types.js';

export class FootballDataClient extends BaseClient {
  
  async getCompetitions(plan?: string): Promise<CompetitionsResponse> {
    const query = plan ? `?plan=${plan}` : '';
    return this.request<CompetitionsResponse>(`/competitions${query}`);
  }

  async getCompetition(id: number): Promise<Competition> {
    return this.request<Competition>(`/competitions/${id}`);
  }

  async getTeams(competitionId: number): Promise<{ count: number; teams: Team[] }> {
    return this.request<{ count: number; teams: Team[] }>(`/competitions/${competitionId}/teams`);
  }

  async getTeam(id: number): Promise<Team> {
    return this.request<Team>(`/teams/${id}`);
  }

  async getMatches(dateFrom?: string, dateTo?: string, competitionIds?: number[]): Promise<MatchesResponse> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (competitionIds && competitionIds.length > 0) {
        params.append('competitions', competitionIds.join(','));
    }

    const queryString = params.toString();
    const endpoint = `/matches${queryString ? `?${queryString}` : ''}`;
    
    return this.request<MatchesResponse>(endpoint);
  }
  
  async getMatchesForCompetition(competitionId: number, matchday?: number): Promise<MatchesResponse> {
      const params = new URLSearchParams();
      if (matchday) params.append('matchday', matchday.toString());
      
      const queryString = params.toString();
      return this.request<MatchesResponse>(`/competitions/${competitionId}/matches${queryString ? `?${queryString}` : ''}`);
  }

  async getStandings(competitionId: number): Promise<StandingsResponse> {
    return this.request<StandingsResponse>(`/competitions/${competitionId}/standings`);
  }

  async getMatch(id: number): Promise<Match> {
    return this.request<Match>(`/matches/${id}`);
  }
}

export const footballDataClient = new FootballDataClient();
