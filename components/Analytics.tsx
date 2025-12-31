import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Calendar, DollarSign, BarChart3, 
  ChevronLeft, ChevronRight, Sun, Snowflake, Leaf, Flower2,
  ArrowUpRight, ArrowDownRight, Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, calculateDays } from '../services/mockBackend';

interface AnalyticsProps {
  bookings: Booking[];
}

// Seasonality chart colors
const SEASON_COLORS = {
  winter: '#60a5fa', // blue
  spring: '#4ade80', // green
  summer: '#fbbf24', // yellow
  autumn: '#f97316'  // orange
};

const Analytics: React.FC<AnalyticsProps> = ({ bookings }) => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Available years from bookings
  const years = useMemo(() => {
    const yearSet = new Set(bookings.map(b => new Date(b.checkIn).getFullYear()));
    yearSet.add(new Date().getFullYear());
    yearSet.add(new Date().getFullYear() + 1); // For forecast
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [bookings]);

  // Filter bookings by year
  const yearBookings = useMemo(() => {
    return bookings.filter(b => {
      const year = new Date(b.checkIn).getFullYear();
      return year === selectedYear;
    });
  }, [bookings, selectedYear]);

  const confirmedBookings = useMemo(() => {
    return yearBookings.filter(b => 
      b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED
    );
  }, [yearBookings]);

  // ===================
  // SEASONALITY ANALYSIS
  // ===================
  const seasonalityData = useMemo(() => {
    const months = [
      { name: 'Янв', season: 'winter' },
      { name: 'Фев', season: 'winter' },
      { name: 'Мар', season: 'spring' },
      { name: 'Апр', season: 'spring' },
      { name: 'Май', season: 'spring' },
      { name: 'Июн', season: 'summer' },
      { name: 'Июл', season: 'summer' },
      { name: 'Авг', season: 'summer' },
      { name: 'Сен', season: 'autumn' },
      { name: 'Окт', season: 'autumn' },
      { name: 'Ноя', season: 'autumn' },
      { name: 'Дек', season: 'winter' }
    ];

    const monthlyData = months.map((month, index) => {
      const monthBookings = confirmedBookings.filter(b => {
        const bookingMonth = new Date(b.checkIn).getMonth();
        return bookingMonth === index;
      });

      const revenue = monthBookings.reduce((sum, b) => sum + calculateTotal(b), 0);
      const bookingsCount = monthBookings.length;
      const occupancyDays = monthBookings.reduce((sum, b) => 
        sum + calculateDays(b.checkIn, b.checkOut), 0
      );

      return {
        ...month,
        revenue,
        bookings: bookingsCount,
        occupancyDays,
        color: SEASON_COLORS[month.season as keyof typeof SEASON_COLORS]
      };
    });

    return monthlyData;
  }, [confirmedBookings]);

  // Peak and low seasons
  const seasonAnalysis = useMemo(() => {
    const sortedByRevenue = [...seasonalityData].sort((a, b) => b.revenue - a.revenue);
    const peakMonths = sortedByRevenue.slice(0, 3);
    const lowMonths = sortedByRevenue.slice(-3).reverse();

    const avgRevenue = seasonalityData.reduce((sum, m) => sum + m.revenue, 0) / 12;

    return { peakMonths, lowMonths, avgRevenue };
  }, [seasonalityData]);

  // ===================
  // REVENUE FORECAST
  // ===================
  const revenueForecast = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Calculate historical average per month (last 2 years if available)
    const historicalMonthlyAvg: Record<number, number[]> = {};
    
    bookings
      .filter(b => b.status === BookingStatus.COMPLETED)
      .forEach(b => {
        const month = new Date(b.checkIn).getMonth();
        const revenue = calculateTotal(b);
        if (!historicalMonthlyAvg[month]) historicalMonthlyAvg[month] = [];
        historicalMonthlyAvg[month].push(revenue);
      });

    // Calculate average for each month
    const monthlyAvgRevenue = Object.entries(historicalMonthlyAvg).reduce((acc, [month, revenues]) => {
      acc[parseInt(month)] = revenues.reduce((s, r) => s + r, 0) / revenues.length;
      return acc;
    }, {} as Record<number, number>);

    // Generate forecast data
    const forecastData = [];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const year = currentMonth + i >= 12 ? currentYear + 1 : currentYear;
      const monthName = new Date(year, monthIndex).toLocaleString('ru-RU', { month: 'short' });
      
      // Actual data for past/current months in selected year
      const actualBookings = confirmedBookings.filter(b => {
        const d = new Date(b.checkIn);
        return d.getMonth() === monthIndex && d.getFullYear() === selectedYear;
      });
      const actualRevenue = actualBookings.reduce((sum, b) => sum + calculateTotal(b), 0);

      // Confirmed future bookings
      const futureConfirmed = bookings.filter(b => {
        const d = new Date(b.checkIn);
        return d.getMonth() === monthIndex && 
               d.getFullYear() === (currentMonth + i >= 12 ? currentYear + 1 : currentYear) &&
               (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.REQUEST);
      });
      const confirmedFutureRevenue = futureConfirmed.reduce((sum, b) => sum + calculateTotal(b), 0);

      // Historical average for forecast
      const historicalAvg = monthlyAvgRevenue[monthIndex] || 0;
      
      // Is this month in the past?
      const isPast = i === 0 ? today.getDate() > 15 : i < 0;
      const isCurrent = i === 0;
      const isFuture = i > 0;

      forecastData.push({
        month: monthName,
        monthIndex,
        actual: isPast || isCurrent ? actualRevenue : null,
        confirmed: isFuture ? confirmedFutureRevenue : null,
        forecast: isFuture ? Math.max(confirmedFutureRevenue, historicalAvg * 0.7) : null,
        potential: isFuture ? historicalAvg : null,
        isPast,
        isCurrent,
        isFuture
      });
    }

    // Summary stats
    const confirmedFuture = forecastData
      .filter(d => d.isFuture && d.confirmed)
      .reduce((sum, d) => sum + (d.confirmed || 0), 0);
    
    const potentialFuture = forecastData
      .filter(d => d.isFuture)
      .reduce((sum, d) => sum + (d.potential || 0), 0);

    const actualYTD = forecastData
      .filter(d => d.isPast || d.isCurrent)
      .reduce((sum, d) => sum + (d.actual || 0), 0);

    return {
      data: forecastData,
      confirmedFuture,
      potentialFuture,
      actualYTD
    };
  }, [bookings, confirmedBookings, selectedYear]);

  // ===================
  // YEAR COMPARISON
  // ===================
  const yearComparison = useMemo(() => {
    const prevYear = selectedYear - 1;
    
    const currentYearRevenue = confirmedBookings.reduce((sum, b) => sum + calculateTotal(b), 0);
    
    const prevYearBookings = bookings.filter(b => {
      const year = new Date(b.checkIn).getFullYear();
      return year === prevYear && 
        (b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED);
    });
    const prevYearRevenue = prevYearBookings.reduce((sum, b) => sum + calculateTotal(b), 0);

    const growth = prevYearRevenue > 0 
      ? ((currentYearRevenue - prevYearRevenue) / prevYearRevenue) * 100 
      : 0;

    return {
      current: currentYearRevenue,
      previous: prevYearRevenue,
      growth
    };
  }, [bookings, confirmedBookings, selectedYear]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()} ₽
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const SeasonIcon = ({ season }: { season: string }) => {
    switch (season) {
      case 'winter': return <Snowflake size={16} />;
      case 'spring': return <Flower2 size={16} />;
      case 'summer': return <Sun size={16} />;
      case 'autumn': return <Leaf size={16} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Year Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('analytics.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t('analytics.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-bold text-slate-900 dark:text-white">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Year Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <DollarSign size={18} />
            <span className="text-sm font-medium">{t('analytics.yearRevenue')}</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {yearComparison.current.toLocaleString()} ₽
          </p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            yearComparison.growth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {yearComparison.growth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(yearComparison.growth).toFixed(1)}% {t('analytics.vsLastYear')}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Target size={18} />
            <span className="text-sm font-medium">{t('analytics.confirmedFuture')}</span>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {revenueForecast.confirmedFuture.toLocaleString()} ₽
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {t('analytics.alreadyBooked')}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">{t('analytics.potential')}</span>
          </div>
          <p className="text-3xl font-bold">
            {revenueForecast.potentialFuture.toLocaleString()} ₽
          </p>
          <p className="text-sm opacity-80 mt-2">
            {t('analytics.basedOnHistory')}
          </p>
        </motion.div>
      </div>

      {/* Seasonality Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-orange-500" />
              {t('analytics.seasonality')}
            </h3>
            <p className="text-sm text-slate-500">{t('analytics.monthlyBreakdown')}</p>
          </div>

          {/* Season Legend */}
          <div className="flex gap-4">
            {Object.entries(SEASON_COLORS).map(([season, color]) => (
              <div key={season} className="flex items-center gap-1 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <SeasonIcon season={season} />
              </div>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonalityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name={t('analytics.revenue')} radius={[8, 8, 0, 0]}>
                {seasonalityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak/Low Season Analysis */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-green-500" />
              {t('analytics.peakSeason')}
            </h4>
            <div className="space-y-2">
              {seasonAnalysis.peakMonths.map((month, i) => (
                <div key={month.name} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {i + 1}. {month.name}
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {month.revenue.toLocaleString()} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
              <ArrowDownRight size={16} className="text-red-500" />
              {t('analytics.lowSeason')}
            </h4>
            <div className="space-y-2">
              {seasonAnalysis.lowMonths.map((month, i) => (
                <div key={month.name} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {i + 1}. {month.name}
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {month.revenue.toLocaleString()} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Revenue Forecast Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              {t('analytics.revenueForecast')}
            </h3>
            <p className="text-sm text-slate-500">{t('analytics.next12Months')}</p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueForecast.data}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Actual revenue (past) */}
              <Area 
                type="monotone" 
                dataKey="actual" 
                name={t('analytics.actual')}
                stroke="#10b981" 
                fill="url(#actualGradient)"
                strokeWidth={2}
              />
              
              {/* Confirmed bookings (future) */}
              <Bar 
                dataKey="confirmed" 
                name={t('analytics.confirmed')}
                fill="#22c55e" 
                radius={[4, 4, 0, 0]}
              />
              
              {/* Forecast line */}
              <Line 
                type="monotone" 
                dataKey="potential" 
                name={t('analytics.potentialForecast')}
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Summary */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            {t('analytics.forecastSummary')}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {t('analytics.forecastDescription', {
              confirmed: revenueForecast.confirmedFuture.toLocaleString(),
              potential: revenueForecast.potentialFuture.toLocaleString()
            })}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
