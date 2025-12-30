import React, { useMemo, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, calculateDays } from '../services/mockBackend';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, Users, Wallet, Receipt, DollarSign, Calendar, Trophy, Repeat, UserPlus } from 'lucide-react';

interface Props {
  bookings: Booking[];
}

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];
const RETENTION_COLORS = ['#10b981', '#3b82f6'];

const Reports: React.FC<Props> = ({ bookings }) => {
  // Get all available years
  const years = useMemo(() => {
    const y = Array.from(new Set(bookings.map(b => new Date(b.checkIn).getFullYear())));
    if (y.length === 0) return [new Date().getFullYear()];
    return y.sort((a: number, b: number) => b - a);
  }, [bookings]);

  const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());

  const completedOrConfirmed = useMemo(() => 
    bookings.filter(b => {
        const d = new Date(b.checkIn);
        return (b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED) && d.getFullYear() === selectedYear;
    }),
  [bookings, selectedYear]);

  // --- 1. KPIs Calculations (Filtered by Year) ---
  const totalRevenue = completedOrConfirmed.reduce((sum, b) => sum + calculateTotal(b), 0);
  const totalBookings = completedOrConfirmed.length;
  const averageCheck = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  
  // Calculate accommodation revenue vs services
  let incomeAccommodation = 0;
  let incomeServices = 0;
  let incomeFines = 0;

  completedOrConfirmed.forEach(b => {
      const days = calculateDays(b.checkIn, b.checkOut);
      incomeAccommodation += days * b.pricePerDay;
      
      const services = (b.expenses || []).reduce((s, i) => s + i.amount, 0) + (b.diaperCost || 0);
      incomeServices += services;
      
      incomeFines += (b.damageCost || 0);
  });

  // --- 2. Monthly Composite Data (Revenue + Count) ---
  const getMonthlyData = () => {
    if (completedOrConfirmed.length === 0) return [];
    
    // Create base array for all months in selected year
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const monthlyStats: Record<number, { revenue: number, count: number }> = {};
    
    months.forEach((_, i) => monthlyStats[i] = { revenue: 0, count: 0 });

    completedOrConfirmed.forEach(b => {
      const date = new Date(b.checkIn);
      const monthIdx = date.getMonth();
      const total = calculateTotal(b);
      
      monthlyStats[monthIdx].revenue += total;
      monthlyStats[monthIdx].count += 1;
    });

    return months.map((name, i) => ({
        name,
        revenue: monthlyStats[i].revenue,
        count: monthlyStats[i].count
    }));
  };

  const monthlyData = getMonthlyData();

  // --- 3. Income Structure Data ---
  const incomeStructureData = [
      { name: 'Проживание', value: incomeAccommodation },
      { name: 'Доп. услуги', value: incomeServices },
      { name: 'Штрафы/Ущерб', value: incomeFines }
  ].filter(i => i.value > 0);

  // --- 4. Services Popularity ---
  const getServicesStats = () => {
      const stats: Record<string, number> = {};
      completedOrConfirmed.forEach(b => {
          if (b.expenses) {
              b.expenses.forEach(ex => {
                  const key = ex.title.trim(); 
                  stats[key] = (stats[key] || 0) + ex.amount;
              });
          }
      });
      return Object.entries(stats)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
  };
  const topServices = getServicesStats();

  // --- 5. Customer Retention & LTV Logic ---
  const { retentionData, topClients } = useMemo(() => {
      // 1. Determine first visit for EVERY dog in history (not just selected year)
      const firstVisits = new Map<string, number>();
      
      bookings.forEach(b => {
          if (b.status === BookingStatus.CANCELLED) return;
          const name = b.dogName.trim();
          const year = new Date(b.checkIn).getFullYear();
          
          if (!firstVisits.has(name) || year < firstVisits.get(name)!) {
              firstVisits.set(name, year);
          }
      });

      // 2. Analyze customers active in SELECTED year
      const activeClientsMap: Record<string, { visits: number, revenue: number }> = {};
      let newClients = 0;
      let returningClients = 0;
      
      completedOrConfirmed.forEach(b => {
          const name = b.dogName.trim();
          const revenue = calculateTotal(b);
          
          if (!activeClientsMap[name]) {
              activeClientsMap[name] = { visits: 0, revenue: 0 };
          }
          activeClientsMap[name].visits += 1;
          activeClientsMap[name].revenue += revenue;
      });

      // Count retention based on unique dogs active this year
      Object.keys(activeClientsMap).forEach(name => {
          const firstYear = firstVisits.get(name);
          if (firstYear === selectedYear) {
              newClients++;
          } else {
              returningClients++;
          }
      });

      // Sort for Top Clients
      const sortedClients = Object.entries(activeClientsMap)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

      return {
          retentionData: [
              { name: 'Новые', value: newClients },
              { name: 'Постоянные', value: returningClients }
          ],
          topClients: sortedClients
      };

  }, [bookings, completedOrConfirmed, selectedYear]);

  // --- 6. Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 text-sm">
          <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">{label} {selectedYear}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="flex items-center gap-2" style={{ color: p.color }}>
               <span className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}}></span>
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Финансовая аналитика</h2>
           <p className="text-slate-500 dark:text-slate-400">Детальный разбор доходов за {selectedYear} год.</p>
        </div>
        
        {/* Year Filter */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {years.map(year => (
                <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        selectedYear === year 
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50' 
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
                    }`}
                >
                    {year}
                </button>
            ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Wallet className="h-4 w-4" /> Выручка ({selectedYear})
                  </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                  {totalRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-500">₽</span>
              </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Receipt className="h-4 w-4" /> Средний чек
                  </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                  {averageCheck.toLocaleString()} <span className="text-sm font-normal text-slate-500">₽</span>
              </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Сделок ({selectedYear})
                  </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                  {totalBookings}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Revenue & Volume Trend */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <TrendingUp size={18} className="text-teal-600" />
                  Динамика ({selectedYear})
              </h3>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.3}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                
                <Bar yAxisId="left" name="Выручка" dataKey="revenue" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={32} />
                <Line yAxisId="right" name="Заезды" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{r: 4, fill:'#f59e0b', strokeWidth: 2, stroke:'#fff'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Income Structure Pie */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <DollarSign size={18} className="text-teal-600" />
                  Структура ({selectedYear})
              </h3>
          </div>
          <div className="h-[300px] w-full min-w-0">
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
                            labelLine={false}
                        >
                            {incomeStructureData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                </ResponsiveContainer>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">Нет данных для этого периода</div>
             )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Chart 3: Customer Retention */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <Repeat size={18} className="text-blue-500" />
                      Клиенты ({selectedYear})
                  </h3>
              </div>
              <div className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={retentionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                          >
                              {retentionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={RETENTION_COLORS[index]} strokeWidth={0} />
                              ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-slate-100 font-bold text-xl">
                              {retentionData.reduce((a,b) => a + b.value, 0)}
                          </text>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                   <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                       <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1"><UserPlus size={14}/> Новые</p>
                       <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{retentionData[0].value}</p>
                   </div>
                   <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                       <p className="text-xs text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1"><Repeat size={14}/> Повторные</p>
                       <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{retentionData[1].value}</p>
                   </div>
              </div>
          </div>

          {/* Chart 4: Top Clients */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <Trophy size={18} className="text-amber-500" />
                      Топ клиентов ({selectedYear})
                  </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {topClients.length > 0 ? (
                      <div className="space-y-3">
                          {topClients.map((client, idx) => (
                              <div key={idx} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                                       idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-teal-500'
                                   }`}>
                                       {idx + 1}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">{client.name}</p>
                                       <p className="text-xs text-slate-500">{client.visits} визитов</p>
                                   </div>
                                   <div className="text-right">
                                       <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{client.revenue.toLocaleString()} ₽</p>
                                   </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">Нет данных</div>
                  )}
              </div>
          </div>
      </div>
      
      {/* Chart 5: Services & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
             <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-lg">Топ доп. услуг ({selectedYear})</h3>
             </div>
             <div className="space-y-4">
                 {topServices.length > 0 ? (
                     topServices.map((service, idx) => {
                         const maxVal = topServices[0].value;
                         const percent = (service.value / maxVal) * 100;
                         return (
                             <div key={idx} className="relative">
                                 <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                     <span>{service.name}</span>
                                     <span>{service.value.toLocaleString()} ₽</span>
                                 </div>
                                 <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-teal-500 rounded-full" 
                                        style={{ width: `${percent}%` }}
                                     ></div>
                                 </div>
                             </div>
                         )
                     })
                 ) : (
                     <p className="text-slate-400 text-center py-10 text-sm">Дополнительные услуги не оказывались</p>
                 )}
             </div>
          </div>

          {/* Summary Card - keeping it distinct but cleaner */}
          <div className="rounded-xl bg-slate-900 text-slate-50 p-6 shadow-md relative overflow-hidden flex flex-col justify-center">
             <div className="relative z-10">
                 <h3 className="text-lg font-bold mb-3">Финансовое здоровье</h3>
                 <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                     В <b>{selectedYear}</b> году доля дополнительных услуг составляет <b>{totalRevenue ? ((incomeServices / totalRevenue) * 100).toFixed(1) : 0}%</b> от общего оборота.
                     {((incomeServices / totalRevenue) * 100) < 10 
                        ? ' Рекомендуем активнее предлагать клиентам доп. опции (груминг, такси, фотоотчеты).'
                        : ' Отличный показатель! Вы эффективно монетизируете дополнительные сервисы.'
                     }
                 </p>
                 <div className="flex gap-3">
                     <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                         <span className="block text-[10px] uppercase opacity-70">Проживание</span>
                         <span className="font-bold text-base">{Math.round((incomeAccommodation / totalRevenue) * 100 || 0)}%</span>
                     </div>
                     <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                         <span className="block text-[10px] uppercase opacity-70">Услуги</span>
                         <span className="font-bold text-base">{Math.round((incomeServices / totalRevenue) * 100 || 0)}%</span>
                     </div>
                 </div>
             </div>
          </div>

      </div>
    </div>
  );
};

export default Reports;