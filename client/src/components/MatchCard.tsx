import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logEvent } from '@/lib/analytics';
import { TeamLogo } from './TeamLogo';
import { formatToLocal, getRemainingTime } from '@/lib/dateUtils';
import { getStadiumForTeam } from '@/lib/stadiums';
import { MapPin } from 'lucide-react';
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
      className="bg-white hover:bg-gray-50/80 transition-all duration-200 py-4 px-5 cursor-pointer group relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-0.5 h-full transition-all duration-300 ${
          isLive ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
          match.status === 'FINISHED' ? 'bg-gray-300' : 
          'bg-blue-500'
      }`}></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
        {/* Main Content Area */}
        <div className="flex items-center gap-6 md:gap-8 flex-1">
          
          {/* Time & Status Column */}
          <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center">
            {isLive ? (
               <div className="flex flex-col items-center">
                   <span className="text-red-600 font-bold text-sm animate-pulse mb-1">
                     {match.minute ? `${match.minute}'` : 'LIVE'}
                   </span>
                   <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
               </div>
            ) : match.status === 'FINISHED' ? (
               <div className="flex flex-col items-center">
                   <span className="text-gray-900 font-bold text-sm tracking-tight">FT</span>
                   <span className="text-[10px] text-gray-400 font-medium mt-0.5">{formattedTime}</span>
               </div>
            ) : (
                <div className="flex flex-col items-center">
                    <span className="text-gray-900 font-bold text-base tracking-tight">{formattedTime}</span>
                    {remainingTime && (
                        <span className="text-[10px] text-blue-600 font-medium mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            {remainingTime.type === 'STARTING_SOON' 
                              ? t('time.starting_soon')
                              : remainingTime.hours && remainingTime.hours > 0
                                ? `${remainingTime.hours}h`
                                : `${remainingTime.minutes}m`
                            }
                        </span>
                    )}
                </div>
            )}
          </div>

          {/* Teams Scoreboard Column */}
          <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
            {/* Home Team */}
            <div className="flex items-center justify-between group/team">
              <div className="flex items-center gap-3 transition-transform group-hover/team:translate-x-1 duration-200">
                <TeamLogo src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-6 h-6 object-contain drop-shadow-sm" />
                <div className="flex flex-col">
                  <span className={`text-[15px] font-semibold leading-none ${match.score.fullTime.home > match.score.fullTime.away && match.status === 'FINISHED' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {match.homeTeam.name}
                  </span>
                  {homeGoals.length > 0 && (
                    <div className="text-[10px] text-gray-400 font-medium leading-tight mt-1 flex flex-wrap gap-x-2">
                      {homeGoals.map((g: { name: string; minute: number }, i: number) => (
                        <span key={i} className="flex items-center">
                          <span className="w-1 h-1 rounded-full bg-gray-300 mr-1"></span>
                          {g.name} <span className="text-gray-300 ml-0.5">{g.minute}'</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(isLive || match.status === 'FINISHED') && (
                <span className={`text-lg font-bold w-8 text-center tabular-nums ${match.score.fullTime.home > match.score.fullTime.away ? 'text-gray-900' : 'text-gray-400'}`}>
                    {match.score.fullTime.home ?? 0}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between group/team">
              <div className="flex items-center gap-3 transition-transform group-hover/team:translate-x-1 duration-200">
                <TeamLogo src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-6 h-6 object-contain drop-shadow-sm" />
                <div className="flex flex-col">
                  <span className={`text-[15px] font-semibold leading-none ${match.score.fullTime.away > match.score.fullTime.home && match.status === 'FINISHED' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {match.awayTeam.name}
                  </span>
                  {awayGoals.length > 0 && (
                    <div className="text-[10px] text-gray-400 font-medium leading-tight mt-1 flex flex-wrap gap-x-2">
                      {awayGoals.map((g: { name: string; minute: number }, i: number) => (
                        <span key={i} className="flex items-center">
                          <span className="w-1 h-1 rounded-full bg-gray-300 mr-1"></span>
                          {g.name} <span className="text-gray-300 ml-0.5">{g.minute}'</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(isLive || match.status === 'FINISHED') && (
                <span className={`text-lg font-bold w-8 text-center tabular-nums ${match.score.fullTime.away > match.score.fullTime.home ? 'text-gray-900' : 'text-gray-400'}`}>
                    {match.score.fullTime.away ?? 0}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Column: Stage & Venue (Desktop: Right, Mobile: Bottom) */}
        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 pl-12 md:pl-0 border-t md:border-t-0 border-gray-50 pt-2 md:pt-0 mt-1 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {stageLabel && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-gray-400">
              <span className="text-[10px] font-medium uppercase tracking-wider">{stageLabel}</span>
            </div>
          )}
          
          {venue && (
            <div className="hidden md:flex items-center gap-1 text-gray-300">
              <MapPin className="w-3 h-3" />
              <span className="text-[10px]">{venue}</span>
            </div>
          )}
          
          <div className="md:hidden flex-1 text-right">
             <span className="text-[10px] text-blue-500 font-medium">Ver detalles &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
