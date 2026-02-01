import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInSeconds } from 'date-fns';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const WorldCupIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base */}
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 21V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 21V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Cuerpo */}
    <path d="M12 18C14.5 18 16 16.5 16 14C16 11.5 15 10 12 10C9 10 8 11.5 8 14C8 16.5 9.5 18 12 18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    {/* Globo */}
    <path d="M12 10C14.2091 10 16 8.20914 16 6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6C8 8.20914 9.79086 10 12 10Z" stroke="currentColor" strokeWidth="2" />
    <path d="M8.5 6H15.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <path d="M12 2V10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const WorldCupCountdown = () => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-06-11T00:00:00Z'); // Approximate start
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = differenceInSeconds(targetDate, now);

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (3600 * 24)),
          hours: Math.floor((difference % (3600 * 24)) / 3600),
          minutes: Math.floor((difference % 3600) / 60),
          seconds: difference % 60,
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl p-4 text-white shadow-lg mb-6 transform hover:scale-[1.01] transition-transform duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <WorldCupIcon className="w-5 h-5 text-yellow-300" />
          {t('world_cup.title')} 🇺🇸🇲🇽🇨🇦
        </h3>
        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">{t('world_cup.date')}</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-2xl font-bold font-mono">{timeLeft.days}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">{t('world_cup.days')}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-2xl font-bold font-mono">{timeLeft.hours}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">{t('world_cup.hours')}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-2xl font-bold font-mono">{timeLeft.minutes}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">{t('world_cup.minutes')}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-2xl font-bold font-mono">{timeLeft.seconds}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">{t('world_cup.seconds')}</div>
        </div>
      </div>
      
      <div className="mt-3 text-center text-xs opacity-90 italic">{t('world_cup.countdown_text')} ⚽🌎</div>
    </div>
  );
};

export default WorldCupCountdown;
