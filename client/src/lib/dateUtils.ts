import { format, addDays, parseISO, differenceInMinutes, isToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es, enUS, fr, Locale } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  es,
  en: enUS,
  fr
};

const getLocale = (lang: string) => {
  const code = lang ? lang.split('-')[0] : 'es';
  return locales[code] || es;
};

// Get user's timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Format UTC date to local display string
export const formatToLocal = (dateStr: string, formatStr: string = 'PP p', lang: string = 'es'): string => {
  try {
    const date = parseISO(dateStr);
    const timeZone = getUserTimezone();
    return formatInTimeZone(date, timeZone, formatStr, { locale: getLocale(lang) });
  } catch (e) {
    console.error('Error formatting date', e);
    return dateStr;
  }
};

// Format UTC date to local date object
export const toLocalDate = (dateStr: string): Date => {
    return new Date(dateStr);
}

// Generate calendar days
export interface CalendarDay {
  day: string;
  date: string;
  fullDate: string; // ISO string for comparison
  isToday: boolean;
}

export const generateCalendarDays = (centerDateStr?: string, lang: string = 'es'): CalendarDay[] => {
  // Fix: remove unsed variable 'center'
  // const center = centerDateStr ? new Date(centerDateStr) : new Date();
  const days: CalendarDay[] = [];
  
  // Generate 3 days before and 3 days after center date
  // Need to correctly parse the input date string which is in YYYY-MM-DD format
  // to avoid timezone issues when creating the Date object.
  // Appending T00:00:00 ensures local time at start of day, or better yet, treat as UTC or explicit parts
  // But since we work with local dates for display, new Date('YYYY-MM-DD') creates UTC midnight which might be previous day locally.
  // Safer to split and create date.
  let centerDate: Date;
  
  if (centerDateStr) {
      const [y, m, d] = centerDateStr.split('-').map(Number);
      centerDate = new Date(y, m - 1, d); // Local midnight
  } else {
      centerDate = new Date();
  }

  const locale = getLocale(lang);

  for (let i = -3; i < 4; i++) {
    const date = addDays(centerDate, i);
    days.push({
      day: format(date, 'EEE', { locale }).toUpperCase().replace('.', ''),
      date: format(date, 'd MMM', { locale }).toUpperCase().replace('.', ''),
      fullDate: format(date, 'yyyy-MM-dd'),
      isToday: false, 
    });
  }
  
  return days;
};

// Format header date (e.g. "Miércoles, 28 de Enero, 2026")
export const getHeaderDate = (selectedDateStr?: string, lang: string = 'es'): string => {
    let date: Date;
    if (selectedDateStr) {
        const [y, m, d] = selectedDateStr.split('-').map(Number);
        date = new Date(y, m - 1, d);
    } else {
        date = new Date();
    }
    // Capitalize first letter
    const str = format(date, "EEEE, d 'de' MMMM, yyyy", { locale: getLocale(lang) });
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get remaining time string for today's matches
export interface RemainingTime {
  type: 'STARTING_SOON' | 'COUNTDOWN';
  hours?: number;
  minutes?: number;
}

export const getRemainingTime = (dateStr: string): RemainingTime | null => {
  try {
    const date = parseISO(dateStr);
    
    // Only calculate for today
    if (!isToday(date)) return null;
    
    const now = new Date();
    const diffInMinutes = differenceInMinutes(date, now);
    
    // If match started or passed (allow 5 mins buffer for "Just starting")
    if (diffInMinutes < -5) return null;
    
    if (diffInMinutes <= 0) return { type: 'STARTING_SOON' };
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    return { type: 'COUNTDOWN', hours, minutes };
  } catch {
    return null;
  }
};
