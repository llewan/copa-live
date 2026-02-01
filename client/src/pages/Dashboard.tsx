import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getMatches } from '@/services/api';
import MatchCard from '@/components/MatchCard';
import MatchCardSkeleton from '@/components/MatchCardSkeleton';
import Calendar from '@/components/Calendar';
import SEO from '@/components/SEO';
import WorldCupCountdown from '@/components/WorldCupCountdown';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { generateCalendarDays, getHeaderDate } from '@/lib/dateUtils';
import { format, addDays, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { usePreferenceStore } from '@/store/preferenceStore';
import { useAuthStore } from '@/store/authStore';
import { TEAMS } from '@/lib/teams';
import { Match } from '@/types';

export const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'my_teams'>('all');
  
  const { user } = useAuthStore();
  const { preferences, loadPreferences } = usePreferenceStore();
  
  // Set default filter mode based on preferences
  useEffect(() => {
    if (user && preferences.followedTeams.length > 0) {
      setFilterMode('my_teams');
    } else {
      setFilterMode('all');
    }
  }, [preferences.followedTeams.length, user]);

  const calendarRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadPreferences(user.id);
    }
  }, [user, loadPreferences]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // State for selected date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  // State for current time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Generate calendar days based on selected date
  const days = useMemo(() => generateCalendarDays(selectedDate, i18n.language), [selectedDate, i18n.language]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true); // Always show loading when date changes
      const data = await getMatches(selectedDate);
      setMatches(data);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
    // Refresh data every 5 minutes (300000ms) to save queries
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]); // Re-fetch when selectedDate changes

  // Group matches by competition
  const groupedMatches = useMemo(() => {
    // First, filter matches if needed
    let filteredMatches = matches;
    if (filterMode === 'my_teams' && preferences.followedTeams.length > 0) {
      // Map followed team IDs to their names for matching against API data
      // We use names because API team IDs might differ from our local static IDs
      const followedTeamNames = preferences.followedTeams.flatMap(id => {
        // loose equality to handle string/number mismatch
        const team = TEAMS.find(t => t.id.toString() === id.toString());
        return team ? [team.name, team.shortName] : [];
      });

      filteredMatches = matches.filter(match => {
        const homeName = match.homeTeam.name || match.homeTeam.shortName || '';
        const awayName = match.awayTeam.name || match.awayTeam.shortName || '';
        
        return followedTeamNames.some(name => 
          name && (homeName.includes(name) || awayName.includes(name))
        );
      });
    }

    return filteredMatches.reduce((acc, match) => {
      const compName = match.competition.name;
      if (!acc[compName]) {
        acc[compName] = [];
      }
      acc[compName].push(match);
      // Sort matches within the league by date
      acc[compName].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
      return acc;
    }, {} as Record<string, Match[]>);
  }, [matches, filterMode, preferences.followedTeams]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <>
      <SEO 
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col">
          {/* Header Section */}
          <div className="flex flex-col mb-6">
            <WorldCupCountdown />
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-black">{t('dashboard.title')}</h1>
              <div className="flex items-center gap-3">
                {user && preferences.followedTeams.length > 0 ? (
                  <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    <button 
                      onClick={() => setFilterMode('all')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filterMode === 'all' 
                          ? 'bg-white text-black shadow-sm' 
                          : 'text-gray-500 hover:text-black'
                      }`}
                    >{t('dashboard.all')}</button>
                    <button 
                      onClick={() => setFilterMode('my_teams')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filterMode === 'my_teams' 
                          ? 'bg-white text-primary-600 shadow-sm' 
                          : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {t('dashboard.my_teams')}
                    </button>
                  </div>
                ) : null}
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors sm:flex">
                  {t('dashboard.select_league')} <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Selector */}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 mb-2 shadow-sm">
              <button 
                 onClick={() => {
                     // Simple implementation: just shift selected date by -1 day
                     // For a real scrollable calendar, we'd shift the window of days
                     const prev = addDays(new Date(selectedDate), -1);
                     setSelectedDate(format(prev, 'yyyy-MM-dd'));
                 }}
                 className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div 
                className="flex gap-2 overflow-x-auto no-scrollbar flex-1 justify-center px-4"
                key={selectedDate} // Force re-render for animation
              >
                {days.map((d, i) => {
                  const isActive = d.fullDate === selectedDate;
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleDateSelect(d.fullDate)}
                      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg cursor-pointer min-w-[80px] transition-colors ${
                        isActive 
                          ? 'bg-gray-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-[10px] font-bold tracking-wider mb-0.5 ${isActive ? 'text-black' : 'text-gray-500'}`}>
                        {d.day}
                      </span>
                      <span className={`text-xs ${isActive ? 'font-bold text-black' : 'text-gray-400'}`}>
                        {d.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button 
                 onClick={() => {
                     const next = addDays(new Date(selectedDate), 1);
                     setSelectedDate(format(next, 'yyyy-MM-dd'));
                 }}
                 className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="border-l border-gray-200 pl-2 ml-2 relative" ref={calendarRef}>
                 <button 
                   onClick={() => setShowCalendar(!showCalendar)}
                   className={`p-2 rounded text-gray-600 transition-colors ${showCalendar ? 'bg-gray-100 text-black' : 'hover:bg-gray-100'}`}
                 >
                   <CalendarIcon className="w-5 h-5" />
                 </button>
                 
                 {showCalendar && (
                    <div className="absolute top-full right-0 mt-2 z-50">
                        <Calendar 
                            selectedDate={selectedDate}
                            onSelect={handleDateSelect}
                            onClose={() => setShowCalendar(false)}
                        />
                    </div>
                 )}
              </div>
            </div>

            <div className="flex justify-between items-end px-1">
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-500 font-medium">
                    {getHeaderDate(selectedDate)}
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <RefreshCw className="w-3 h-3" />
                      {(() => {
                        const diffInSeconds = differenceInSeconds(currentTime, lastUpdated);
                        const diffInMinutes = differenceInMinutes(currentTime, lastUpdated);
                        
                        if (diffInSeconds < 60) {
                          return (
                            <span className="flex items-center gap-1 text-green-600 font-medium animate-pulse">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              Actualizado en tiempo real
                            </span>
                          );
                        } else {
                          return (
                            <span>Actualizado hace {diffInMinutes} min</span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
                <div className="text-xl font-mono font-bold text-gray-800 tracking-tight">
                {format(currentTime, 'HH:mm:ss')}
                </div>
            </div>
          </div>

          {/* Matches List */}
          {loading ? (
            <div className="space-y-6">
               {[1, 2].map((i) => (
                 <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                   <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-200">
                     <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                   </div>
                   <div className="divide-y divide-gray-100">
                     {[1, 2, 3].map((j) => (
                       <MatchCardSkeleton key={j} />
                     ))}
                   </div>
                 </div>
               ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
              {error}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out" key={selectedDate}>
              {Object.keys(groupedMatches).length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                   <p className="text-gray-500 text-lg">No hay partidos programados para esta fecha.</p>
                 </div>
              ) : (
                Object.entries(groupedMatches).map(([league, leagueMatches]) => (
                    <div key={league} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-200">
                        <h2 className="font-bold text-black text-lg">{league}</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {leagueMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                    </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
