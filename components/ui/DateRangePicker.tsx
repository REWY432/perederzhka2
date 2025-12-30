import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../../types';
import { cn } from '../../utils/helpers';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  bookings: Booking[];
  maxCapacity: number;
  excludeBookingId?: string;
  className?: string;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  bookings,
  maxCapacity,
  excludeBookingId,
  className
}) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = checkIn ? new Date(checkIn) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selecting, setSelecting] = useState<'checkIn' | 'checkOut'>('checkIn');

  const weekdays = i18n.language === 'ru' ? WEEKDAYS : WEEKDAYS_EN;

  // Calculate occupancy for the displayed month
  const occupancyMap = useMemo(() => {
    const map = new Map<string, number>();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      const occupancy = bookings.filter(b => {
        if (b.id === excludeBookingId) return false;
        if (b.status === BookingStatus.CANCELLED) return false;
        return dateStr >= b.checkIn && dateStr <= b.checkOut;
      }).length;

      map.set(dateStr, occupancy);
    }

    return map;
  }, [bookings, currentMonth, excludeBookingId]);

  const getDayStatus = (dateStr: string): 'free' | 'busy' | 'full' => {
    const occupancy = occupancyMap.get(dateStr) || 0;
    if (occupancy >= maxCapacity) return 'full';
    if (occupancy >= maxCapacity * 0.7) return 'busy';
    return 'free';
  };

  const isInRange = (dateStr: string) => {
    if (!checkIn || !checkOut) return false;
    return dateStr >= checkIn && dateStr <= checkOut;
  };

  const isRangeStart = (dateStr: string) => dateStr === checkIn;
  const isRangeEnd = (dateStr: string) => dateStr === checkOut;

  const handleDayClick = (dateStr: string) => {
    const status = getDayStatus(dateStr);
    if (status === 'full') return;

    if (selecting === 'checkIn') {
      onChangeCheckIn(dateStr);
      if (checkOut && dateStr > checkOut) {
        onChangeCheckOut('');
      }
      setSelecting('checkOut');
    } else {
      if (dateStr < checkIn) {
        onChangeCheckIn(dateStr);
        onChangeCheckOut('');
      } else {
        onChangeCheckOut(dateStr);
        setSelecting('checkIn');
      }
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days: Array<{ date: Date; dateStr: string } | null> = [];

    // Empty slots for start
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0]
      });
    }

    return days;
  }, [currentMonth]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800', className)}>
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-slate-600 dark:text-slate-400">{t('calendar.free')}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-600 dark:text-slate-400">{t('calendar.busy')}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-slate-600 dark:text-slate-400">{t('calendar.full')}</span>
        </span>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={t('a11y.previousMonth')}
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
          {currentMonth.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </h3>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={t('a11y.nextMonth')}
        >
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          if (!item) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const { date, dateStr } = item;
          const status = getDayStatus(dateStr);
          const isPast = dateStr < today;
          const isToday = dateStr === today;
          const inRange = isInRange(dateStr);
          const isStart = isRangeStart(dateStr);
          const isEnd = isRangeEnd(dateStr);
          const isDisabled = isPast || status === 'full';

          return (
            <motion.button
              key={dateStr}
              whileHover={!isDisabled ? { scale: 1.1 } : undefined}
              whileTap={!isDisabled ? { scale: 0.95 } : undefined}
              onClick={() => !isDisabled && handleDayClick(dateStr)}
              disabled={isDisabled}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors',
                isDisabled && 'cursor-not-allowed opacity-40',
                !isDisabled && !inRange && 'hover:bg-slate-100 dark:hover:bg-slate-800',
                inRange && !isStart && !isEnd && 'bg-orange-100 dark:bg-orange-900/30',
                (isStart || isEnd) && 'bg-orange-500 text-white',
                isToday && !isStart && !isEnd && 'ring-2 ring-orange-500 ring-inset'
              )}
              aria-label={`${t('a11y.selectDate')}: ${dateStr}`}
              aria-pressed={isStart || isEnd}
            >
              <span className={cn(
                'text-sm font-medium',
                (isStart || isEnd) ? 'text-white' : 'text-slate-900 dark:text-white',
                isDisabled && 'text-slate-300 dark:text-slate-600'
              )}>
                {date.getDate()}
              </span>
              
              {/* Occupancy Indicator */}
              {!isDisabled && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mt-0.5',
                  status === 'free' && 'bg-green-400',
                  status === 'busy' && 'bg-amber-400',
                  status === 'full' && 'bg-red-400'
                )} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection Info */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
        <button
          onClick={() => setSelecting('checkIn')}
          className={cn(
            'flex-1 p-3 rounded-xl border-2 transition-colors text-left',
            selecting === 'checkIn'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-slate-200 dark:border-slate-700'
          )}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('booking.checkIn')}</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {checkIn || '—'}
          </p>
        </button>
        
        <button
          onClick={() => setSelecting('checkOut')}
          className={cn(
            'flex-1 p-3 rounded-xl border-2 transition-colors text-left',
            selecting === 'checkOut'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-slate-200 dark:border-slate-700'
          )}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('booking.checkOut')}</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {checkOut || '—'}
          </p>
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
