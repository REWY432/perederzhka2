import React from 'react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal } from '../services/mockBackend';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Props {
  bookings: Booking[];
}

const Reports: React.FC<Props> = ({ bookings }) => {
  const completedOrConfirmed = bookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED);

  // 1. Monthly Income (Last 12 Months)
  const getMonthlyData = () => {
    const data: Record<string, number> = {};
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    completedOrConfirmed.forEach(b => {
      const date = new Date(b.checkIn);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      const total = calculateTotal(b);
      data[key] = (data[key] || 0) + total;
    });

    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  };

  const monthlyData = getMonthlyData();

  // 2. Top Clients (Dogs)
  const getTopDogs = () => {
    const dogStats: Record<string, number> = {};
    completedOrConfirmed.forEach(b => {
      const total = calculateTotal(b);
      dogStats[b.dogName] = (dogStats[b.dogName] || 0) + total;
    });

    return Object.entries(dogStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  };

  const topDogs = getTopDogs();

  // 3. Weekly Occupancy Heatmap (Simulated)
  const getWeeklyLoad = () => {
     const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
     const load = [0,0,0,0,0,0,0];

     completedOrConfirmed.forEach(b => {
        const start = new Date(b.checkIn);
        const end = new Date(b.checkOut);
        
        // Simple heuristic: count check-in day
        load[start.getDay()]++;
     });

     // Shift so Monday is first
     const sun = load.shift();
     if(sun !== undefined) load.push(sun);
     const shiftedDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

     return shiftedDays.map((d, i) => ({ name: d, value: load[i] }));
  };

  const weeklyLoad = getWeeklyLoad();

  // 4. Expense Analysis
  const expenseStats = completedOrConfirmed.reduce(
    (acc, curr) => {
      acc.diapers += (curr.diaperCost || 0);
      acc.damages += (curr.damageCost || 0);
      return acc;
    },
    { diapers: 0, damages: 0 }
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white drop-shadow-md">Финансовые отчеты</h2>
        <p className="text-white/80 font-medium">Структура доходов и расходов.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Revenue Chart */}
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 text-lg">Выручка по месяцам</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.5)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.1)'}}
                  contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#fff' }}
                  formatter={(value) => `${Number(value).toLocaleString()} ₽`} 
                />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={40}>
                   {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#colorGradient)" />
                    ))}
                </Bar>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            {monthlyData.length === 0 && <p className="text-center text-gray-500 mt-4">Нет данных о доходах.</p>}
          </div>
        </div>

        {/* Weekly Load */}
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 text-lg">Популярные дни заезда</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyLoad}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.5)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.1)'}}
                  contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={30}>
                  {weeklyLoad.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#8b5cf6" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dogs Chart */}
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 text-lg">Топ-10 Клиентов (по деньгам)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDogs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.5)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.1)'}}
                  contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#fff' }}
                  formatter={(value) => `${Number(value).toLocaleString()} ₽`} 
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {topDogs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#f59e0b" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {topDogs.length === 0 && <p className="text-center text-gray-500 mt-4">Нет данных.</p>}
          </div>
        </div>
      </div>

      {/* Expense Summary */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-lg">Сводка расходов</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-5 bg-red-100/50 dark:bg-red-900/30 backdrop-blur-md rounded-2xl border border-red-100/50 dark:border-red-900/50">
             <p className="text-red-700 dark:text-red-300 text-sm font-bold uppercase tracking-wider">Памперсы и расходники</p>
             <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{expenseStats.diapers.toLocaleString()} ₽</p>
           </div>
           <div className="p-5 bg-orange-100/50 dark:bg-orange-900/30 backdrop-blur-md rounded-2xl border border-orange-100/50 dark:border-orange-900/50">
             <p className="text-orange-700 dark:text-orange-300 text-sm font-bold uppercase tracking-wider">Ущерб и ремонт</p>
             <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{expenseStats.damages.toLocaleString()} ₽</p>
           </div>
           <div className="p-5 bg-white/40 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10">
             <p className="text-gray-600 dark:text-gray-300 text-sm font-bold uppercase tracking-wider">Всего расходов</p>
             <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{(expenseStats.diapers + expenseStats.damages).toLocaleString()} ₽</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;