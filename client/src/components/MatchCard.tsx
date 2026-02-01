import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logEvent } from '@/lib/analytics';
import { TeamLogo } from './TeamLogo';
import { formatToLocal, getRemainingTime } from '@/lib/dateUtils';
import { getStadiumForTeam } from '@/lib/stadiums';
import { Trophy, MapPin } from 'lucide-react';
import { Match, MatchEvent } from '@/types';
import { TFunction } from 'i18next';

interface MatchCardProps {
  match: Match;
}

const getStageLabel = (stage: string, group: string | null, t: TFunction) => {
  if (group) return group.replace('_', ' ');
  switch (stage) {
    case 'REGULAR_SEASON': return t('match.stages.regular_season');
    case 'GROUP_STAGE': return t('match.stages.group_stage');
    case 'LEAGUE_STAGE': return t('match.stages.league_stage');
    case 'ROUND_OF_16': return t('match.stages.round_of_16');
    case 'QUARTER_FINALS': return t('match.stages.quarter_finals');
    case 'SEMI_FINALS': return t('match.stages.semi_finals');
    case 'FINAL': return t('match.stages.final');
    case 'THIRD_PLACE': return t('match.stages.third_place');
    case 'PRELIMINARY_ROUND': return t('match.stages.preliminary_round');
    case 'QUALIFICATION_ROUND_1': return t('match.stages.qualification_round_1');
    case 'QUALIFICATION_ROUND_2': return t('match.stages.qualification_round_2');
    case 'QUALIFICATION_ROUND_3': return t('match.stages.qualification_round_3');
    case 'PLAYOFF_ROUND': return t('match.stages.playoff_round');
    default: return stage?.replace(/_/g, ' ') || '';
  }
};

export const MatchCard = ({ match }: MatchCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    logEvent('Match', 'View Details', `${match.homeTeam.name} vs ${match.awayTeam.name}`, match.id);
    navigate(`/match/${match.id}`);
  };

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isScheduled = match.status === 'SCHEDULED';
  
  // Use our timezone-aware formatter
  const formattedTime = formatToLocal(match.utcDate, 'p');
  
  // Calculate remaining time for scheduled matches
  const remainingTime = isScheduled ? getRemainingTime(match.utcDate) : null;

  const stageLabel = getStageLabel(match.stage, match.group, t);
  const venue = match.venue || getStadiumForTeam(match.homeTeam.name);

  // Helper to extract goals for a team
  const getGoals = (teamName: string) => {
    if (!match.events) return [];
    return match.events
      .filter((e: MatchEvent) => e.type === 'GOAL' && e.team.name === teamName)
      .map((e: MatchEvent) => ({ 
        name: e.player?.name?.split(' ').pop() || e.player?.name || '', 
        minute: e.minute 
      }));
  };

  const homeGoals = (isLive || match.status === 'FINISHED') ? getGoals(match.homeTeam.name) : [];
  const awayGoals = (isLive || match.status === 'FINISHED') ? getGoals(match.awayTeam.name) : [];

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 py-5 px-5 cursor-pointer group transform hover:-translate-y-0.5 relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
          isLive ? 'bg-red-500 animate-pulse' : 
          match.status === 'FINISHED' ? 'bg-gray-300' : 
          'bg-blue-500'
      }`}></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pl-2">
        <div className="flex items-center gap-6 md:gap-10 flex-1">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0 flex flex-col items-center md:items-start">
            <span className="text-base font-bold text-gray-900 tracking-tight">{formattedTime}</span>
            {isLive ? (
               <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100 animate-pulse">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                 {t('match.status.live')} {match.minute ? `${match.minute}'` : ''}
               </span>
            ) : match.status === 'FINISHED' ? (
               <span className="block text-[11px] text-gray-500 font-bold mt-1 bg-gray-100 px-2 py-0.5 rounded-full">
                 {t('match.status.finished')}
               </span>
            ) : remainingTime && (
                <span className="block text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-full">
                    {remainingTime.type === 'STARTING_SOON' 
                      ? t('time.starting_soon')
                      : remainingTime.hours && remainingTime.hours > 0
                        ? `${remainingTime.hours}h ${remainingTime.minutes}m`
                        : `${remainingTime.minutes}m`
                    }
                </span>
            )}
          </div>

          {/* Teams Column */}
          <div className="flex flex-col gap-3 min-w-[220px] flex-1">
            <div className="flex items-start justify-between group/team">
              <div className="flex items-start gap-3 transition-transform group-hover/team:translate-x-1 duration-200">
                <TeamLogo src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-7 h-7 object-contain drop-shadow-sm mt-0.5" />
                <div className="flex flex-col">
                  <span className={`text-base font-semibold ${match.score.fullTime.home > match.score.fullTime.away && match.status === 'FINISHED' ? 'text-gray-900' : 'text-gray-700'}`}>
                      {match.homeTeam.name}
                  </span>
                  {homeGoals.length > 0 && (
                    <div className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5 max-w-[200px]">
                      {homeGoals.map((g: { name: string; minute: number }, i: number) => (
                        <span key={i} className="inline-block mr-1.5">
                          {g.name} <span className="text-gray-400">{g.minute}'</span>{i < homeGoals.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(isLive || match.status === 'FINISHED') && (
                <span className={`text-lg font-bold w-8 text-center ${match.score.fullTime.home > match.score.fullTime.away ? 'text-gray-900' : 'text-gray-500'}`}>
                    {match.score.fullTime.home ?? 0}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between group/team">
              <div className="flex items-start gap-3 transition-transform group-hover/team:translate-x-1 duration-200">
                <TeamLogo src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-7 h-7 object-contain drop-shadow-sm mt-0.5" />
                <div className="flex flex-col">
                  <span className={`text-base font-semibold ${match.score.fullTime.away > match.score.fullTime.home && match.status === 'FINISHED' ? 'text-gray-900' : 'text-gray-700'}`}>
                      {match.awayTeam.name}
                  </span>
                  {awayGoals.length > 0 && (
                    <div className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5 max-w-[200px]">
                      {awayGoals.map((g: { name: string; minute: number }, i: number) => (
                        <span key={i} className="inline-block mr-1.5">
                          {g.name} <span className="text-gray-400">{g.minute}'</span>{i < awayGoals.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(isLive || match.status === 'FINISHED') && (
                <span className={`text-lg font-bold w-8 text-center ${match.score.fullTime.away > match.score.fullTime.home ? 'text-gray-900' : 'text-gray-500'}`}>
                    {match.score.fullTime.away ?? 0}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Column: Stage & Venue */}
        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1.5 pl-6 md:pl-0 border-t md:border-t-0 border-gray-50 pt-3 md:pt-0 mt-1 md:mt-0">
          {stageLabel && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wide">{stageLabel}</span>
            </div>
          )}
          
          {venue && (
            <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-600 transition-colors">
              <MapPin className="w-3 h-3" />
              <span className="text-[11px] font-medium">{venue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
