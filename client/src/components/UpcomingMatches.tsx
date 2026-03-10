import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Match } from '@/types';
import { getUpcomingMatches } from '@/services/api';
import { usePreferenceStore } from '@/store/preferenceStore';
import { TEAMS } from '@/lib/teams';
import { TeamLogo } from './TeamLogo';
import { formatToLocal } from '@/lib/dateUtils';
import { Calendar, MapPin } from 'lucide-react';

export const UpcomingMatches = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences } = usePreferenceStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUpcoming = async () => {
      console.log('Fetching upcoming matches. Followed teams:', preferences.followedTeams);
      // We removed the early return if followedTeams is empty to ensure we can debug or show empty state if needed,
      // but the logic below relies on teamNames being present.
      // Actually, if followedTeams is empty, we shouldn't fetch, but we should update state to stop loading.
      
      if (preferences.followedTeams.length === 0) {
          setLoading(false);
          setMatches([]);
          return;
      }

      // Get team names/aliases from preferences
      const teamNames = preferences.followedTeams.flatMap(id => {
        const team = TEAMS.find(t => t.id.toString() === id.toString());
        return team ? [team.name, team.shortName, ...(team.aliases || [])] : [];
      }).filter(Boolean) as string[];

      console.log('Team names to fetch:', teamNames);
      if (teamNames.length === 0) {
          setLoading(false);
          setMatches([]);
          return;
      }

      setLoading(true);
      try {
        const data = await getUpcomingMatches(teamNames);
        console.log('Upcoming matches data:', data);
        setMatches(data);
      } catch (error) {
        console.error('Failed to fetch upcoming matches', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, [preferences.followedTeams]);

  const hasFollowedTeams = preferences.followedTeams.length > 0;
  const hasMatches = matches.length > 0;

  useEffect(() => {
    console.log('[UpcomingMatches] State:', { loading, hasFollowedTeams, hasMatches });
  }, [loading, hasFollowedTeams, hasMatches]);

  return (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></span>
            {t('dashboard.upcoming.title')}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 ml-4">{t('dashboard.upcoming.description')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[280px] md:min-w-[300px] snap-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-32 animate-pulse shrink-0">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !hasFollowedTeams ? (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">{t('preferences.subtitle')}</p>
          <button 
            onClick={() => navigate('/preferences')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow transition-all"
          >
            {t('nav.preferences')}
          </button>
        </div>
      ) : !hasMatches ? (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-500">{t('dashboard.no_matches')}</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full">
          {matches.map((match) => (
            <div 
              key={match.id}
              onClick={() => navigate(`/match/${match.id}`)}
              className="min-w-[280px] md:min-w-[300px] snap-center bg-white group hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-xl p-4 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 cursor-pointer relative overflow-hidden shrink-0"
            >
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>

              {/* Header: Date & League */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit mb-1">
                    <Calendar className="w-3 h-3" />
                    {formatToLocal(match.utcDate, 'EEE d MMM', i18n.language)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider pl-1">
                    {formatToLocal(match.utcDate, 'p', i18n.language)}
                  </span>
                </div>
                {match.competition.emblem && (
                  <img src={match.competition.emblem} alt={match.competition.name} className="w-6 h-6 object-contain opacity-80" />
                )}
              </div>

              {/* Teams */}
              <div className="flex justify-between items-center px-2 relative z-10">
                <div className="flex flex-col items-center gap-2 group/home">
                  <TeamLogo src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-10 h-10 object-contain drop-shadow-sm group-hover/home:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-center text-gray-800 line-clamp-1 max-w-[80px] leading-tight">
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">VS</span>
                </div>

                <div className="flex flex-col items-center gap-2 group/away">
                  <TeamLogo src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-10 h-10 object-contain drop-shadow-sm group-hover/away:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-center text-gray-800 line-clamp-1 max-w-[80px] leading-tight">
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                </div>
              </div>

              {/* Footer: Venue */}
              {(match.venue) && (
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-center gap-1.5 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] truncate max-w-full">{match.venue}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
