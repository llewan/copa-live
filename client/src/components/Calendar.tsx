import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  addDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect, onClose, className }) => {
  // Parse the selected date string to a Date object
  const [currentDate, setCurrentDate] = useState(() => {
    try {
        const [y, m, d] = selectedDate.split('-').map(Number);
        return new Date(y, m - 1, d);
    } catch {
        return new Date();
    }
  });

  // State for the month being viewed (independent of selection)
  const [viewDate, setViewDate] = useState(currentDate);

  useEffect(() => {
    // When selectedDate prop changes, update the internal current date
    try {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const newDate = new Date(y, m - 1, d);
        setCurrentDate(newDate);
        // Optional: Sync view if selected date jumps far? For now, let's just keep view stable unless user navigates.
    } catch {
        // ignore
    }
  }, [selectedDate]);

  const headerDate = viewDate;

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDayLabels = eachDayOfInterval({
      start: startOfWeek(new Date(), { locale: es }),
      end: addDays(startOfWeek(new Date(), { locale: es }), 6)
  }).map(d => format(d, 'EEEEEE', { locale: es }));


  return (
    <div className={cn("bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[320px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 capitalize">
          {format(headerDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <button 
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDayLabels.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = dateStr === selectedDate;
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
                <button
                    key={dateStr}
                    onClick={() => {
                        onSelect(dateStr);
                        onClose();
                    }}
                    className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors relative",
                        !isCurrentMonth && "text-gray-300",
                        isCurrentMonth && !isSelected && "text-gray-700 hover:bg-gray-100",
                        isSelected && "bg-black text-white hover:bg-gray-800",
                        isToday && !isSelected && "text-blue-600 font-bold bg-blue-50"
                    )}
                >
                    {format(day, 'd')}
                    {isToday && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default Calendar;
