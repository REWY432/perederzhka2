import React, { useState } from 'react';
import { Booking, BookingStatus, AVAILABLE_TAGS } from '../types';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, LogIn, LogOut, Home } from 'lucide-react';
import { formatDate } from '../services/mockBackend';

interface Props {
  bookings: Booking[];
}

const CalendarView: React.FC<Props> = ({ bookings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); 

  const activeBookings = bookings.filter(b => b.status !== BookingStatus.CANCELLED);

  const activeDogsOnDate = (date: Date) => {
    return activeBookings.filter(b => {
      const start = new Date(b.checkIn);
      start.setHours(0,0,0,0);
      const end = new Date(b.checkOut);
      end.setHours(0,0,0,0);
      const check = new Date(date);
      check.setHours(0,0,0,0);
      return check >= start && check <= end;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayStatus = (booking: Booking, date: Date) => {
      const d = new Date(date); d.setHours(0,0,0,0);
      const start = new Date(booking.checkIn); start.setHours(0,0,0,0);
      const end = new Date(booking.checkOut); end.setHours(0,0,0,0);
      
      if (d.getTime() === start.getTime()) return { label: 'Заезд', icon: LogIn, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
      if (d.getTime() === end.getTime()) return { label: 'Выезд', icon: LogOut, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
      return { label: 'Проживание', icon: Home, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' };
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-white/10 dark:bg-white/5 min-h-[120px] backdrop-blur-sm border-r border-b border-white/10 dark:border-white/5"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dogs = activeDogsOnDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div 
            key={i} 
            onClick={() => setSelectedDate(date)}
            className={`min-h-[120px] p-2 border-r border-b border-white/20 dark:border-white/5 relative group hover:bg-white/20 dark:hover:bg-white/10 transition-all cursor-pointer ${
              isToday ? 'bg-blue-100/30 dark:bg-blue-900/30' : 'bg-white/30 dark:bg-black/20 backdrop-blur-md'
            }`}
        >
          <div className="flex justify-between items-start">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
              isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-white/10'
            }`}>
              {i}
            </span>
            {dogs.length > 0 && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 dark:bg-black/50 px-2 py-0.5 rounded text-[10px] font-bold text-gray-700 dark:text-gray-300">
                    Показать
                </div>
            )}
          </div>
          
          <div className="mt-2 space-y-1.5 overflow-hidden">
            {dogs.slice(0, 3).map(dog => (
               <div key={dog.id} 
                    className={`text-xs px-2 py-1.5 rounded-lg truncate shadow-sm backdrop-blur-md border border-white/20 font-medium flex items-center justify-between ${
                      dog.status === BookingStatus.CONFIRMED 
                        ? 'bg-teal-100/70 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200' 
                        : 'bg-amber-100/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                    }`}
                >
                 <span>{dog.dogName}</span>
                 {dog.tags && dog.tags.length > 0 && (
                   <div className="flex -space-x-1 ml-1">
                      {dog.tags.map(t => {
                         const color = AVAILABLE_TAGS.find(at => at.label === t)?.color || 'bg-gray-400';
                         return <div key={t} className={`w-2 h-2 rounded-full ${color}`}></div>
                      })}
                   </div>
                 )}
               </div>
            ))}
            {dogs.length > 3 && (
               <div className="text-xs text-gray-500 dark:text-gray-400 font-bold pl-1">+еще {dogs.length - 3}</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
          {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2.5 bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 rounded-full text-gray-700 dark:text-gray-200 shadow-sm transition-all"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-2.5 bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 rounded-full text-gray-700 dark:text-gray-200 shadow-sm transition-all"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden">
        <div className="grid grid-cols-7 bg-white/30 dark:bg-black/20 border-b border-white/20 dark:border-white/10 text-center py-3">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-white/5 dark:bg-black/5">
          {renderDays()}
        </div>
      </div>
      
       <div className="flex gap-4 flex-wrap text-sm text-white font-medium bg-black/20 p-4 rounded-xl backdrop-blur-md border border-white/10">
          {AVAILABLE_TAGS.map(t => (
            <div key={t.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
              <span>{t.label}</span>
            </div>
          ))}
      </div>

      {/* Day Details Modal */}
      {selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDate(null)}></div>
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 w-full max-w-lg overflow-hidden">
                  
                  <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-xl text-teal-600 dark:text-teal-400">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white capitalize">
                                {selectedDate.toLocaleString('ru-RU', { day: 'numeric', month: 'long' })}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                {selectedDate.toLocaleString('ru-RU', { weekday: 'long' })}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                      {activeDogsOnDate(selectedDate).length === 0 ? (
                          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                              <Home size={48} className="mx-auto mb-4 opacity-20" />
                              <p className="font-medium">На этот день нет бронирований</p>
                          </div>
                      ) : (
                          activeDogsOnDate(selectedDate).map(booking => {
                              const status = getDayStatus(booking, selectedDate);
                              const StatusIcon = status.icon;

                              return (
                                  <div key={booking.id} className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 border border-gray-100 dark:border-white/5 flex items-start gap-4 hover:bg-white/80 dark:hover:bg-white/5 transition-colors">
                                      <div className={`p-2 rounded-xl ${status.color}`}>
                                          <StatusIcon size={20} />
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex justify-between items-start">
                                              <div>
                                                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{booking.dogName}</h4>
                                                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{booking.breed}</p>
                                              </div>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                  booking.status === BookingStatus.CONFIRMED ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                                              }`}>
                                                  {booking.status === BookingStatus.CONFIRMED ? 'Подтверждено' : 'Заявка'}
                                              </span>
                                          </div>
                                          
                                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                              <span className="bg-white dark:bg-white/10 px-2 py-1 rounded border border-gray-200 dark:border-white/10">
                                                  Заезд: {formatDate(booking.checkIn)}
                                              </span>
                                              <span className="bg-white dark:bg-white/10 px-2 py-1 rounded border border-gray-200 dark:border-white/10">
                                                  Выезд: {formatDate(booking.checkOut)}
                                              </span>
                                          </div>
                                          
                                          {booking.tags && booking.tags.length > 0 && (
                                              <div className="mt-3 flex gap-1 flex-wrap">
                                                  {booking.tags.map(t => {
                                                      const tagStyle = AVAILABLE_TAGS.find(at => at.label === t);
                                                      return (
                                                          <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded font-bold text-white ${tagStyle?.color || 'bg-gray-400'}`}>
                                                              {t}
                                                          </span>
                                                      )
                                                  })}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;