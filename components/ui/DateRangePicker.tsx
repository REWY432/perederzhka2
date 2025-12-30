import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../../types';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  bookings: Booking[];
  maxCapacity: number;
  excludeBookingId?: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  bookings,
  maxCapacity,
  excludeBookingId
}) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = checkIn ? new Date(checkIn) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selecting, setSelecting] = useState<'checkIn' | 'checkOut'>('checkIn');

  const today = new Date().toISOString().split('T')[0];

  // Calculate occupancy map for current month view
  const occupancyMap = useMemo(() => {
    const map: Record<string, number> = {};
    const activeBookings = bookings.filter(b => 
      b.status === BookingStatus.CONFIRMED || 
      b.status === BookingStatus.REQUEST
    ).filter(b => b.id !== excludeBookingId);

    // Check dates for current month ± 1 month
    const startDate = new Date(currentMonth);
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date(currentMonth);
    endDate.setMonth(endDate.getMonth() + 2);

    activeBookings.forEach(b => {
      const bookingStart = new Date(b.checkIn);
      const bookingEnd = new Date(b.checkOut);

      for (let d = new Date(bookingStart); d <= bookingEnd; d.setDate(d.getDate() + 1)) {
        if (d >= startDate && d <= endDate) {
          const key = d.toISOString().split('T')[0];
          map[key] = (map[key] || 0) + 1;
        }
      }
    });

    return map;
  }, [bookings, currentMonth, excludeBookingId]);

  const getDayStatus = (dateStr: string): 'free' | 'busy' | 'full' => {
    const count = occupancyMap[dateStr] || 0;
    if (count >= maxCapacity) return 'full';
    if (count >= maxCapacity * 0.7) return 'busy';
    return 'free';
  };

  const handleDayClick = (dateStr: string) => {
    if (selecting === 'checkIn') {
      onChangeCheckIn(dateStr);
      if (!checkOut || dateStr >= checkOut) {
        // Auto-set checkout to next day
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        onChangeCheckOut(nextDay.toISOString().split('T')[0]);
      }
      setSelecting('checkOut');
    } else {
      if (dateStr > checkIn) {
        onChangeCheckOut(dateStr);
        setSelecting('checkIn');
      } else {
        // If selected date is before checkIn, swap
        onChangeCheckIn(dateStr);
        setSelecting('checkOut');
      }
    }
  };

  const isInRange = (dateStr: string) => {
    if (!checkIn || !checkOut) return false;
    return dateStr > checkIn && dateStr < checkOut;
  };

  const isRangeStart = (dateStr: string) => dateStr === checkIn;
  const isRangeEnd = (dateStr: string) => dateStr === checkOut;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days: Array<{ date: Date; dateStr: string } | null> = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0]
      });
    }
    
    return days;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label={t('calendar.prevMonth')}
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </motion.button>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
          {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
        </h3>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label={t('calendar.nextMonth')}
        >
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
        </motion.button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2"
          >
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
              aria-label={`${date.getDate()} ${currentMonth.toLocaleString('ru-RU', { month: 'long' })}`}
              aria-selected={isStart || isEnd}
            >
              <span className={cn(
                'text-sm font-medium',
                (isStart || isEnd) && 'text-white',
                !isStart && !isEnd && !isDisabled && 'text-slate-700 dark:text-slate-300',
                isDisabled && 'text-slate-400 dark:text-slate-600'
              )}>
                {date.getDate()}
              </span>
              
              {/* Occupancy Indicator - only show for non-disabled, non-full days */}
              {!isDisabled && status !== 'full' && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mt-0.5',
                  status === 'free' && 'bg-green-400',
                  status === 'busy' && 'bg-amber-400'
                )} />
              )}
              
              {/* Show red dot for full days that aren't disabled (edge case) */}
              {!isPast && status === 'full' && (
                <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-red-400" />
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
            'flex-1 p-3 rounded-xl border-2 transition-all',
            selecting === 'checkIn'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-slate-200 dark:border-slate-700'
          )}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('booking.checkIn')}</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {checkIn ? new Date(checkIn).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'}
          </p>
        </button>
        
        <button
          onClick={() => setSelecting('checkOut')}
          className={cn(
            'flex-1 p-3 rounded-xl border-2 transition-all',
            selecting === 'checkOut'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-slate-200 dark:border-slate-700'
          )}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('booking.checkOut')}</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {checkOut ? new Date(checkOut).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'}
          </p>
        </button>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>{t('calendar.free')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{t('calendar.busy')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>{t('calendar.full')}</span>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
