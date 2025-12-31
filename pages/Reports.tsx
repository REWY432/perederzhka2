import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, Users, Wallet, Receipt, DollarSign, Trophy, Repeat, UserPlus } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal } from '../services/api';
import { calculateDays, cn } from '../utils/helpers';
import { ReportsSkeleton, EmptyState } from '../components/ui';

interface ReportsProps {
  bookings: Booking[];
  isLoading?: boolean;
}

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];
const RETENTION_COLORS = ['#10b981', '#3b82f6'];

const Reports: React.FC<ReportsProps> = ({ bookings, isLoading = false }) => {
  const { t, i18n } = useTranslation();

  // Get available years
  const years = useMemo(() => {
    const y = Array.from(new Set(bookings.map(b => new Date(b.checkIn).getFullYear())));
    if (y.length === 0) return [new Date().getFullYear()];
    return y.sort((a, b) => b - a);
  }, [bookings]);

  const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());

  // Filter completed/confirmed bookings for selected year
  const completedBookings = useMemo(() =>
    bookings.filter(b => {
      const d = new Date(b.checkIn);
      return (
        (b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED) &&
        d.getFullYear() === selectedYear
      );
    }),
    [bookings, selectedYear]
  );

  // KPIs
  const { totalRevenue, averageCheck, totalBookings, incomeAccommodation, incomeServices, incomeFines } = useMemo(() => {
    let accommodation = 0;
    let services = 0;
    let fines = 0;

    completedBookings.forEach(b => {
      const days = calculateDays(b.checkIn, b.checkOut);
      accommodation += days * b.pricePerDay;
      services += (b.expenses || []).reduce((s, i) => s + i.amount, 0) + (b.diaperCost || 0);
      fines += b.damageCost || 0;
    });

    const total = accommodation + services + fines;
    const count = completedBookings.length;

    return {
      totalRevenue: total,
      averageCheck: count > 0 ? Math.round(total / count) : 0,
      totalBookings: count,
      incomeAccommodation: accommodation,
      incomeServices: services,
      incomeFines: fines
    };
  }, [completedBookings]);

  // Monthly data
  const monthlyData = useMemo(() => {
    const months = i18n.language === 'ru'
      ? ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const stats: Record<number, { revenue: number; count: number }> = {};
    months.forEach((_, i) => { stats[i] = { revenue: 0, count: 0 }; });

    completedBookings.forEach(b => {
      const monthIdx = new Date(b.checkIn).getMonth();
      stats[monthIdx].revenue += calculateTotal(b);
      stats[monthIdx].count += 1;
    });

    return months.map((name, i) => ({
      name,
      revenue: stats[i].revenue,
      count: stats[i].count
    }));
  }, [completedBookings, i18n.language]);

  // Income structure
  const incomeStructureData = useMemo(() =>
    [
      { name: t('reports.accommodation'), value: incomeAccommodation },
      { name: t('reports.services'), value: incomeServices },
      { name: t('reports.fines'), value: incomeFines }
    ].filter(i => i.value > 0),
    [incomeAccommodation, incomeServices, incomeFines, t]
  );

  // Top services
  const topServices = useMemo(() => {
    const stats: Record<string, number> = {};
    completedBookings.forEach(b => {
      b.expenses?.forEach(ex => {
        const key = (ex.title || '').trim();
        stats[key] = (stats[key] || 0) + ex.amount;
      });
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [completedBookings]);

  // Customer retention & top clients
  const { retentionData, topClients } = useMemo(() => {
    const firstVisits = new Map<string, number>();

    bookings.forEach(b => {
      if (b.status === BookingStatus.CANCELLED) return;
      const name = (b.dogName || '').trim().toLowerCase();
      const year = new Date(b.checkIn).getFullYear();
      if (!firstVisits.has(name) || year < firstVisits.get(name)!) {
        firstVisits.set(name, year);
      }
    });

    const activeClients: Record<string, { visits: number; revenue: number }> = {};
    let newClients = 0;
    let returningClients = 0;

    completedBookings.forEach(b => {
      const name = (b.dogName || '').trim().toLowerCase();
      const revenue = calculateTotal(b);

      if (!activeClients[name]) {
        activeClients[name] = { visits: 0, revenue: 0 };
      }
      activeClients[name].visits += 1;
      activeClients[name].revenue += revenue;
    });

    Object.keys(activeClients).forEach(name => {
      const firstYear = firstVisits.get(name);
      if (firstYear === selectedYear) {
        newClients++;
      } else {
        returningClients++;
      }
    });

    const sorted = Object.entries(activeClients)
      .map(([name, data]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      retentionData: [
        { name: t('reports.newClients'), value: newClients },
        { name: t('reports.returningClients'), value: returningClients }
      ],
      topClients: sorted
    };
  }, [bookings, completedBookings, selectedYear, t]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-sm">
          <p className="font-bold text-slate-900 dark:text-white mb-1">{label} {selectedYear}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="flex items-center gap-2" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.name}:</span>
              <span className="font-bold">
                {p.dataKey === 'revenue' || p.name === 'value'
                  ? `${Number(p.value).toLocaleString()} ₽`
                  : p.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          {t('reports.title')}
        </h2>
        <EmptyState type="noReports" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between md:items-end gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('reports.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t('reports.subtitle')} {selectedYear}
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                selectedYear === year
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Wallet, label: t('reports.revenue'), value: `${totalRevenue.toLocaleString()} ₽`, color: 'orange' },
          { icon: Receipt, label: t('reports.averageCheck'), value: `${averageCheck.toLocaleString()} ₽`, color: 'blue' },
          { icon: Users, label: t('reports.bookingsCount'), value: totalBookings, color: 'green' }
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              <kpi.icon size={16} />
              {kpi.label}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpi.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Dynamics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-teal-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('reports.dynamics')}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar yAxisId="left" name={t('reports.revenue')} dataKey="revenue" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={32} />
                <Line yAxisId="right" name={t('reports.bookingsCount')} type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Income Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-6">
            <DollarSign size={18} className="text-teal-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('reports.structure')}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            {incomeStructureData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeStructureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {incomeStructureData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                {t('common.noData')}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Retention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-6">
            <Repeat size={18} className="text-blue-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('reports.clients')}
            </h3>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={retentionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {retentionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={RETENTION_COLORS[index]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <UserPlus size={14} /> {t('reports.newClients')}
              </p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{retentionData[0].value}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1">
                <Repeat size={14} /> {t('reports.returningClients')}
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{retentionData[1].value}</p>
            </div>
          </div>
        </motion.div>

        {/* Top Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('reports.topClients')}
            </h3>
          </div>
          <div className="space-y-3">
            {topClients.length > 0 ? (
              topClients.map((client, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0',
                    idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-teal-500'
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.visits} {t('reports.visits')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{client.revenue.toLocaleString()} ₽</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-10 text-sm">{t('common.noData')}</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <h3 className="font-semibold text-slate-900 dark:text-white mb-6">
          {t('reports.topServices')}
        </h3>
        <div className="space-y-4">
          {topServices.length > 0 ? (
            topServices.map((service, idx) => {
              const maxVal = topServices[0].value;
              const percent = (service.value / maxVal) * 100;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span>{service.name}</span>
                    <span>{service.value.toLocaleString()} ₽</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                      className="h-full bg-teal-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-400 text-center py-10 text-sm">{t('common.noData')}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
