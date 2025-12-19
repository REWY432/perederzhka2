import React from 'react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, formatDate } from '../services/mockBackend';
import { DollarSign, Home, CalendarDays, TrendingUp } from 'lucide-react';

interface Props {
  bookings: Booking[];
}

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="relative overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] group transition-transform hover:-translate-y-1">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 ${color} blur-xl group-hover:scale-150 transition-transform duration-500`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
        {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg bg-opacity-80 backdrop-blur-md`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const getStatusLabel = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.REQUEST: return 'Заявка';
    case BookingStatus.CONFIRMED: return 'Подтверждено';
    case BookingStatus.COMPLETED: return 'Завершено';
    case BookingStatus.CANCELLED: return 'Отмена';
    default: return status;
  }
};

const Dashboard: React.FC<Props> = ({ bookings }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const nextMonth = (currentMonth + 1) % 12;

  const activeBookings = bookings.filter(b => {
    const start = new Date(b.checkIn);
    const end = new Date(b.checkOut);
    return today >= start && today <= end && b.status !== BookingStatus.CANCELLED;
  });

  const activeDogs = activeBookings.length;

  const thisMonthRevenue = bookings
    .filter(b => {
      const checkIn = new Date(b.checkIn);
      return checkIn.getMonth() === currentMonth && b.status !== BookingStatus.CANCELLED;
    })
    .reduce((sum, b) => sum + calculateTotal(b), 0);

  const nextMonthBookings = bookings.filter(b => {
     const checkIn = new Date(b.checkIn);
     return checkIn.getMonth() === nextMonth && b.status !== BookingStatus.CANCELLED;
  }).length;

  const pendingRequests = bookings.filter(b => b.status === BookingStatus.REQUEST).length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white drop-shadow-md">Обзор</h2>
           <p className="text-white/80 font-medium">Добро пожаловать. Вот ситуация в гостинице на сегодня.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Сейчас живут" value={activeDogs} icon={Home} color="bg-blue-500" subtext="Собак на передержке" />
        <StatCard title="Выручка (Месяц)" value={`${thisMonthRevenue.toLocaleString()} ₽`} icon={DollarSign} color="bg-teal-500" subtext="Прогноз по активным" />
        <StatCard title="След. месяц" value={nextMonthBookings} icon={CalendarDays} color="bg-purple-500" subtext="Подтверждено и заявки" />
        <StatCard title="Новые заявки" value={pendingRequests} icon={TrendingUp} color="bg-amber-500" subtext="Требуют внимания" />
      </div>

      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden">
        <div className="p-6 border-b border-white/20 bg-white/20 dark:bg-black/10">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Последняя активность</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
            <thead className="bg-white/30 dark:bg-black/20 text-gray-600 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-5">Собака</th>
                <th className="p-5">Даты</th>
                <th className="p-5">Статус</th>
                <th className="p-5 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {bookings.sort((a,b) => b.createdAt - a.createdAt).slice(0, 5).map(booking => (
                <tr key={booking.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                  <td className="p-5 font-bold text-gray-900 dark:text-gray-100">{booking.dogName} <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">({booking.breed})</span></td>
                  <td className="p-5 font-medium text-gray-600 dark:text-gray-300">{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md ${
                      booking.status === BookingStatus.CONFIRMED ? 'bg-green-100/60 dark:bg-green-900/40 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800' :
                      booking.status === BookingStatus.REQUEST ? 'bg-amber-100/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800' :
                      booking.status === BookingStatus.CANCELLED ? 'bg-red-100/60 dark:bg-red-900/40 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800' :
                      'bg-gray-100/60 dark:bg-gray-700/40 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                    }`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="p-5 text-right font-bold text-gray-800 dark:text-gray-100">{calculateTotal(booking).toLocaleString()} ₽</td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">Бронирований нет. Создайте первую запись.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;