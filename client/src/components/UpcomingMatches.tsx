import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Match } from '@/types';
import { getUpcomingMatches } from '@/services/api';
import { usePreferenceStore } from '@/store/preferenceStore';
import { useAuthStore } from '@/store/authStore';
import { TeamLogo } from './TeamLogo';
import { formatToLocal } from '@/lib/dateUtils';
import { Calendar, MapPin } from 'lucide-react';
import SurfaceCard from './SurfaceCard';
import StateMessage from './StateMessage';

export const UpcomingMatches = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences } = usePreferenceStore();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      try {
        if (!user) {
          const data = await getUpcomingMatches();
          setMatches(data);
          return;
        }
        if (preferences.followedTeams.length === 0) {
          setMatches([]);
          return;
        }
        const teamIds = preferences.followedTeams
          .map(id => Number(id))
          .filter(id => Number.isFinite(id));
        if (teamIds.length === 0) {
          setMatches([]);
          return;
        }
        const data = await getUpcomingMatches({ teamIds });
        setMatches(data);
      } catch (error) {
        console.error('Failed to fetch upcoming matches', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, [preferences.followedTeams, user]);

  const hasFollowedTeams = preferences.followedTeams.length > 0;
  const hasMatches = matches.length > 0;

  return (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-primary-500 to-primary-700 rounded-full"></span>
            {t('dashboard.upcoming.title')}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 ml-4">{t('dashboard.upcoming.description')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[230px] md:min-w-[250px] snap-center bg-white rounded-xl p-3 shadow-sm border border-gray-100 h-28 animate-pulse shrink-0">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : user && !hasFollowedTeams ? (
        <StateMessage
          message={t('preferences.subtitle')}
          className="text-center p-6"
          actions={(
            <button
              onClick={() => navigate('/preferences')}
              className="ui-btn-base ui-btn-md text-xs font-bold text-primary-600 bg-white rounded-chip shadow-card hover:shadow-card-lg transition-all"
            >
              {t('nav.preferences')}
            </button>
          )}
        />
      ) : !hasMatches ? (
        <StateMessage message={t('dashboard.no_matches')} className="text-center p-6" />
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full">
          {matches.map((match) => (
            <SurfaceCard
              as="button"
              type="button"
              key={match.id}
              onClick={() => navigate(`/match/${match.id}`)}
              className="min-w-[230px] md:min-w-[250px] snap-center group hover:bg-gradient-to-br hover:from-primary-50 hover:to-primary-100 hover:shadow-md transition-all duration-300 relative overflow-hidden shrink-0 text-left p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary-100/20 to-primary-200/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>

              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full w-fit mb-1">
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

              <div className="flex justify-between items-center px-2 relative z-10">
                <div className="flex flex-col items-center gap-2 group/home">
                  <TeamLogo src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-8 h-8 object-contain drop-shadow-sm group-hover/home:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-center text-gray-800 line-clamp-1 max-w-[76px] leading-tight">
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">VS</span>
                </div>

                <div className="flex flex-col items-center gap-2 group/away">
                  <TeamLogo src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-8 h-8 object-contain drop-shadow-sm group-hover/away:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-center text-gray-800 line-clamp-1 max-w-[76px] leading-tight">
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                </div>
              </div>

              {(match.venue) && (
                <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[9px] truncate max-w-full">{match.venue}</span>
                </div>
              )}
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
};
