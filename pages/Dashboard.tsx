import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar as CalendarIcon, Dog, BarChart3, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Booking, BookingStatus } from '../types';
import { calculateTotal } from '../services/api';
import { DashboardSkeleton } from '../components/ui';
import { cn } from '../utils/helpers';

interface DashboardProps {
  bookings: Booking[];
  maxCapacity: number;
  hotelName?: string;
  onNewBooking: () => void;
  isLoading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  bookings,
  maxCapacity,
  hotelName,
  onNewBooking,
  isLoading = false
}) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Current dogs (active bookings for today)
    const currentDogs = bookings.filter(b => {
      if (b.status === BookingStatus.CANCELLED) return false;
      return today >= b.checkIn && today <= b.checkOut;
    }).length;

    // Next month bookings
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const nextMonthCount = bookings.filter(b => {
      const checkIn = new Date(b.checkIn);
      return checkIn >= nextMonth && checkIn <= nextMonthEnd;
    }).length;

    // Current month revenue
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentRevenue = bookings
      .filter(b => {
        if (b.status !== BookingStatus.CONFIRMED && b.status !== BookingStatus.COMPLETED) return false;
        const checkIn = new Date(b.checkIn);
        return checkIn >= currentMonthStart && checkIn <= now;
      })
      .reduce((sum, b) => sum + calculateTotal(b), 0);

    return { currentDogs, nextMonthCount, currentRevenue };
  }, [bookings]);

  // Simple chart data
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((name, i) => ({
      name,
      val: Math.random() * 500 + 200
    }));
  }, []);

  // Calendar data
  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = new Date(year, month, 1).getDay() - 1;

    const getDayStatus = (day: number) => {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = bookings.filter(b => {
        if (b.status !== BookingStatus.CONFIRMED) return false;
        return dateStr >= b.checkIn && dateStr <= b.checkOut;
      }).length;

      if (count === 0) return 'empty';
      if (count >= maxCapacity) return 'full';
      return 'partial';
    };

    return {
      daysInMonth,
      startOffset: firstDayOffset >= 0 ? firstDayOffset : 6,
      getDayStatus
    };
  }, [bookings, maxCapacity]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
            {t('dashboard.welcome')}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {hotelName || 'My Hotel'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-orange-500 transition-colors border border-slate-100 dark:border-slate-700"
            aria-label={t('a11y.notifications')}
          >
            <Bell size={22} />
          </motion.button>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200 dark:shadow-none">
            {hotelName?.[0]?.toUpperCase() || 'D'}
          </div>
        </div>
      </motion.div>

      {/* Hero Action Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewBooking}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-3xl shadow-xl shadow-orange-200 dark:shadow-none flex items-center justify-between group"
      >
        <span className="font-bold text-lg">{t('dashboard.newBooking')}</span>
        <motion.div
          className="bg-white/20 p-2.5 rounded-full"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <Plus size={24} />
        </motion.div>
      </motion.button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-40"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Dog size={20} />
            </div>
            {stats.currentDogs > 0 && (
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={10} /> +{stats.currentDogs}
              </span>
            )}
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('dashboard.currentDogs')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.currentDogs}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-40"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CalendarIcon size={20} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('dashboard.nextMonth')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.nextMonthCount}</p>
          </div>
        </motion.div>
      </div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t('dashboard.revenue')}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.currentRevenue.toLocaleString()} ₽
            </h3>
          </div>
          <BarChart3 className="text-orange-500" size={24} />
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar dataKey="val" radius={[4, 4, 4, 4]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#fb923c' : '#fdba74'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Occupancy Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.occupancy')}</h3>
          <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">
            {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 text-center">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <span key={d} className="text-xs text-slate-400 dark:text-slate-500 font-medium">{d}</span>
          ))}

          {/* Empty slots */}
          {Array.from({ length: calendarData.startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days */}
          {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
            const day = i + 1;
            const today = new Date();
            const isToday = day === today.getDate();
            const status = calendarData.getDayStatus(day);

            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className={cn(
                  'text-sm font-medium',
                  isToday ? 'text-orange-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                )}>
                  {day}
                </span>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  status === 'full' && 'bg-red-500',
                  status === 'partial' && 'bg-orange-400',
                  status === 'empty' && 'bg-slate-200 dark:bg-slate-700'
                )} />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
            {t('calendar.free')}
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            {t('calendar.busy')}
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            {t('calendar.full')}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
