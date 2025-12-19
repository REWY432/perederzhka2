import React, { useState } from 'react';
import { Booking, BookingStatus, AVAILABLE_TAGS } from '../types';
import { calculateTotal, calculateDays, formatDate } from '../services/mockBackend';
import { Calendar, DollarSign, GripVertical, AlertCircle, CheckCircle2, XCircle, Clock, Image as ImageIcon, ChevronLeft, ChevronRight, Hourglass } from 'lucide-react';
import ClientCard from '../components/ClientCard';

interface Props {
  bookings: Booking[];
  onStatusChange: (id: string, status: BookingStatus) => void;
}

const COLUMNS = [
  { id: BookingStatus.WAITLIST, title: 'Лист ожидания', color: 'bg-indigo-500', icon: Hourglass, bg: 'bg-indigo-100/30 dark:bg-indigo-900/20' },
  { id: BookingStatus.REQUEST, title: 'Заявки', color: 'bg-amber-500', icon: Clock, bg: 'bg-amber-100/30 dark:bg-amber-900/20' },
  { id: BookingStatus.CONFIRMED, title: 'Подтверждено', color: 'bg-teal-500', icon: CheckCircle2, bg: 'bg-teal-100/30 dark:bg-teal-900/20' },
  { id: BookingStatus.COMPLETED, title: 'Завершено', color: 'bg-blue-500', icon: CheckCircle2, bg: 'bg-blue-100/30 dark:bg-blue-900/20' },
  { id: BookingStatus.CANCELLED, title: 'Отмена', color: 'bg-red-500', icon: XCircle, bg: 'bg-red-100/30 dark:bg-red-900/20' },
];

const KanbanBoard: React.FC<Props> = ({ bookings, onStatusChange }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<BookingStatus | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: BookingStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: BookingStatus) => {
    e.preventDefault();
    if (draggedId) {
      onStatusChange(draggedId, status);
    }
    setDraggedId(null);
    setDragOverColumn(null);
  };

  const getColumnBookings = (status: BookingStatus) => {
    return bookings
      .filter(b => b.status === status)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  const moveCard = (bookingId: string, currentStatus: BookingStatus, direction: 'prev' | 'next') => {
      const currentIndex = COLUMNS.findIndex(c => c.id === currentStatus);
      if (currentIndex === -1) return;
      
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
          onStatusChange(bookingId, COLUMNS[nextIndex].id as BookingStatus);
      }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white drop-shadow-md">Доска задач</h2>
        <p className="text-white/80 font-medium">Перетаскивайте карточки для смены статуса.</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 md:gap-6 h-full w-max md:min-w-[1000px]">
          {COLUMNS.map((col, colIndex) => {
            const items = getColumnBookings(col.id as BookingStatus);
            const isDragOver = dragOverColumn === col.id;
            const Icon = col.icon;

            return (
              <div 
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id as BookingStatus)}
                onDrop={(e) => handleDrop(e, col.id as BookingStatus)}
                className={`w-[85vw] md:w-auto md:flex-1 md:min-w-[300px] flex flex-col rounded-3xl transition-all duration-300 border backdrop-blur-xl ${
                  isDragOver 
                    ? 'bg-white/40 dark:bg-white/20 border-white scale-[1.02] shadow-2xl' 
                    : `border-white/20 ${col.bg} shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]`
                }`}
              >
                {/* Header */}
                <div className={`p-4 flex items-center justify-between border-b border-white/10`}>
                   <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${col.color} text-white shadow-md`}>
                        <Icon size={18} />
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{col.title}</h3>
                   </div>
                   <span className="bg-white/40 dark:bg-black/30 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300">
                     {items.length}
                   </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                   {items.map(booking => {
                     const total = calculateTotal(booking);
                     const days = calculateDays(booking.checkIn, booking.checkOut);

                     return (
                       <div
                         key={booking.id}
                         draggable
                         onDragStart={(e) => handleDragStart(e, booking.id)}
                         className="group bg-white/60 dark:bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm hover:shadow-lg cursor-move transition-all active:scale-95 active:rotate-1"
                       >
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                   {booking.dogName[0]}
                               </div>
                               <div>
                                  <button onClick={() => setSelectedClientName(booking.dogName)} className="font-bold text-gray-900 dark:text-white leading-tight hover:text-teal-500 dark:hover:text-teal-400 text-left">
                                      {booking.dogName}
                                  </button>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">{booking.breed}</p>
                               </div>
                            </div>
                            <div className="hidden md:block">
                                <GripVertical size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                         </div>
                         
                         <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-white/30 dark:bg-white/5 p-2 rounded-lg">
                               <Calendar size={14} className="text-teal-600 dark:text-teal-400" />
                               <span>{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-1 text-xs font-bold text-gray-800 dark:text-gray-200">
                                  <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                                  {total.toLocaleString()} ₽
                               </div>
                            </div>
                         </div>

                         {/* Mobile Move Controls */}
                         <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20 dark:border-white/5 md:hidden">
                            <button 
                                onClick={() => moveCard(booking.id, booking.status, 'prev')}
                                disabled={colIndex === 0}
                                className={`p-1.5 rounded-lg ${colIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'bg-white/50 text-gray-700'}`}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-[10px] font-bold text-gray-400">Переместить</span>
                            <button 
                                onClick={() => moveCard(booking.id, booking.status, 'next')}
                                disabled={colIndex === COLUMNS.length - 1}
                                className={`p-1.5 rounded-lg ${colIndex === COLUMNS.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'bg-white/50 text-gray-700'}`}
                            >
                                <ChevronRight size={16} />
                            </button>
                         </div>
                       </div>
                     );
                   })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* CRM Client Card Modal */}
      {selectedClientName && (
        <ClientCard 
            dogName={selectedClientName} 
            allBookings={bookings} 
            onClose={() => setSelectedClientName(null)} 
        />
      )}
    </div>
  );
};

export default KanbanBoard;