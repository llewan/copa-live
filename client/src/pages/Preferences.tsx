import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { Check, Bell, Globe, ArrowRight, Shield } from 'lucide-react';
import clsx from 'clsx';
import { TEAMS } from '@/lib/teams';

const Preferences = () => {
  const { t, i18n } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { preferences, setPreferences, savePreferences, loadPreferences, isLoading } = usePreferenceStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadPreferences(user.id);
    }
  }, [user, authLoading, navigate, loadPreferences]);

  const toggleTeam = (teamId: string) => {
    const currentTeams = preferences.followedTeams;
    const newTeams = currentTeams.includes(teamId)
      ? currentTeams.filter(id => id !== teamId)
      : [...currentTeams, teamId];
    setPreferences({ followedTeams: newTeams });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setPreferences({ language: lang });
    i18n.changeLanguage(lang);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setError(null);
    try {
      await savePreferences(user.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(t('preferences.error_save'));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const premierLeagueTeams = TEAMS.filter(t => t.league === 'Premier League');
  const championsLeagueTeams = TEAMS.filter(t => t.league === 'Champions League');

  const renderTeamGrid = (teams: typeof TEAMS) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {teams.map((team) => {
        const isSelected = preferences.followedTeams.includes(team.id.toString());
        return (
          <button
            key={team.id}
            onClick={() => toggleTeam(team.id.toString())}
            className={clsx(
              "relative rounded-xl p-4 flex flex-col items-center justify-center space-y-3 transition-all duration-200 border-2 h-32",
              isSelected 
                ? "border-primary-500 shadow-lg transform scale-105 z-10" 
                : "border-gray-100 hover:border-gray-300 hover:bg-gray-50",
              isSelected ? team.color : "bg-white text-gray-700"
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-sm z-20">
                <Check className="w-3 h-3 text-primary-600" />
              </div>
            )}
            <Shield className={clsx("w-8 h-8", isSelected ? "opacity-90" : "text-gray-400")} />
            <span className={clsx(
              "font-bold text-sm text-center leading-tight",
              isSelected ? "text-white" : "text-gray-700",
              // Handle white backgrounds (like Real Madrid or Default) when selected
              isSelected && (team.color.includes('bg-white') || team.color.includes('bg-yellow-400')) ? "!text-gray-900" : ""
            )}>
              {team.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">{t('preferences.welcome', { name: user.username })}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('preferences.subtitle')}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          
          {/* Premier League Section */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
                PL
              </span>
              {t('preferences.premier_league')}
            </h2>
            {renderTeamGrid(premierLeagueTeams)}
          </div>

          {/* Champions League Section */}
          <div className="p-8 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-lg mr-3">
                CL
              </span>
              {t('preferences.champions_league')}
            </h2>
            {renderTeamGrid(championsLeagueTeams)}
          </div>

          {/* Other Settings */}
          <div className="p-8 bg-white">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('preferences.additional')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <Bell className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900">{t('preferences.notifications_title')}</p>
                    <p className="text-sm text-gray-500">{t('preferences.notifications_desc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreferences({ notifications: !preferences.notifications })}
                  className={clsx(
                    "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
                    preferences.notifications ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={clsx(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200",
                      preferences.notifications ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-4">
                   <div className="bg-white p-2 rounded-full shadow-sm">
                    <Globe className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900">{t('preferences.language_title')}</p>
                    <p className="text-sm text-gray-500">{t('preferences.language_desc')}</p>
                  </div>
                </div>
                <select
                  value={preferences.language}
                  onChange={handleLanguageChange}
                  className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white shadow-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-8 py-4 bg-red-50 text-red-700 text-sm border-t border-red-100">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
             <div className="text-sm text-gray-500">
               {t('preferences.teams_selected', { count: preferences.followedTeams.length })}
             </div>
             <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all transform hover:translate-y-[-1px]"
            >
              {isLoading ? t('preferences.saving') : t('preferences.save_continue')}
              {!isLoading && <ArrowRight className="ml-2 -mr-1 h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Preferences;
