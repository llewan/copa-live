import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMatchDetails } from '@/services/api';
import SEO from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';


import { ArrowLeft, Loader2, Clock, Calendar, MapPin } from 'lucide-react';

import { MatchDetail as MatchDetailType } from '@/types';

export const MatchDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getMatchDetails(id);
      setMatch(data);
    } catch {
      setError(t('match.details.failed_to_load'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !match) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('match.details.back_to_matches')}
        </button>
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-xl border border-red-100">
          <p className="font-semibold text-lg">{error || t('match.details.not_found')}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            {t('match.details.go_home')}
          </button>
        </div>
      </div>
    );
  }

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const matchDate = new Date(match.utcDate);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PLAY': return t('match.status.live');
      case 'PAUSED': return t('match.status.paused');
      case 'FINISHED': return t('match.status.finished');
      case 'SCHEDULED': return t('match.status.scheduled');
      default: return status.replace('_', ' ');
    }
  };

  return (
    <>
      <SEO 
        title={`${match.homeTeam.name} vs ${match.awayTeam.name} - ${t('seo.match_center')}`}
        description={`${t('seo.description')} ${match.homeTeam.name} vs ${match.awayTeam.name}.`}
      />
      
      <div className="pb-12">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-primary-800 to-primary-600 text-white pb-16 pt-8 px-4 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="container mx-auto max-w-5xl relative z-10">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center text-primary-100 hover:text-white mb-8 transition-colors text-sm font-medium group"
            >
              <div className="bg-white/10 p-1.5 rounded-lg mr-2 group-hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-4 h-4" /> 
              </div>
              {t('match.details.back_to_matches')}
            </button>

            <div className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center items-center gap-4 text-primary-100 text-sm mb-8 bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">
                 {isLive ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                 <span className="font-medium">
                   {isLive ? `${t('match.status.live')} ${match.minute}'` : matchDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </span>
                 <span className="mx-2 opacity-50">|</span>
                 <span className="uppercase tracking-wider font-semibold">{getStatusLabel(match.status)}</span>
                 {match.venue && (
                   <>
                     <span className="mx-2 opacity-50">|</span>
                     <div className="flex items-center gap-1">
                       <MapPin className="w-4 h-4" />
                       <span>{match.venue}</span>
                     </div>
                   </>
                 )}
              </div>

              <div className="flex items-center justify-between w-full max-w-3xl px-4 md:px-0">
                {/* Home Team */}
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-4 shadow-xl flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
                    <TeamLogo src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-full h-full" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-center leading-tight">{match.homeTeam.name}</h2>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center w-1/3 z-10">
                  <div className="text-5xl md:text-7xl font-bold tracking-tighter drop-shadow-lg flex items-center gap-4">
                    <span>{match.score.fullTime.home ?? 0}</span>
                    <span className="text-primary-200 font-light opacity-60">:</span>
                    <span>{match.score.fullTime.away ?? 0}</span>
                  </div>
                  {isLive && (
                    <div className="mt-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                      {t('match.status.live')}
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-4 shadow-xl flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
                    <TeamLogo src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-full h-full" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-center leading-tight">{match.awayTeam.name}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 -mt-8 relative z-20">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">{t('match.details.stats')}</h3>
              </div>
              <div className="p-6 space-y-6">
                {match.statistics && match.statistics.length > 0 ? (
                  match.statistics.map((stat, index) => {
                    const homeValue = typeof stat.home === 'string' ? parseFloat(stat.home) : stat.home;
                    const awayValue = typeof stat.away === 'string' ? parseFloat(stat.away) : stat.away;
                    const total = homeValue + awayValue || 1;
                    
                    return (
                    <div key={index}>
                      <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                        <span className="text-gray-900">{stat.home}</span>
                        <span className="uppercase tracking-wide text-xs text-gray-500">{stat.type}</span>
                        <span className="text-gray-900">{stat.away}</span>
                      </div>
                      <div className="flex h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 transition-all duration-1000" 
                          style={{ width: `${(homeValue / total) * 100}%` }}
                        />
                        <div 
                          className="bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${(awayValue / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )})
                ) : (
                  <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">📊</span>
                    </div>
                    <p>{t('match.details.no_stats')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">{t('match.details.timeline')}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {match.events && match.events.length > 0 ? (
                    match.events.map((event, index) => (
                      <div key={index} className="flex gap-4 relative">
                        {/* Timeline Line */}
                        {index !== match.events.length - 1 && (
                          <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-gray-100"></div>
                        )}
                        
                        <div className="flex-none w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 z-10">
                          {event.minute}'
                        </div>
                        
                        <div className="flex-1 pt-1">
                          <div className="font-semibold text-gray-900">
                            {event.player.name} <span className="text-gray-500 font-normal text-sm">({event.team.name})</span>
                          </div>
                          <div className="text-sm text-primary-600 font-medium uppercase tracking-wide mt-0.5 flex items-center gap-2">
                            {event.type === 'GOAL' && `⚽ ${t('match.events.goal')}`}
                            {event.type === 'YELLOW_CARD' && `🟨 ${t('match.events.yellow_card')}`}
                            {event.type === 'RED_CARD' && `🟥 ${t('match.events.red_card')}`}
                            {event.type === 'SUBSTITUTION' && `🔄 ${t('match.events.substitution')}`}
                            {!['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'].includes(event.type) && event.type}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">⏱️</span>
                      </div>
                      <p>{t('match.details.no_events')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchDetail;
