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
  { id: BookingStatus.WAITLIST, title: 'Ожидание', color: 'text-indigo-600', icon: Hourglass },
  { id: BookingStatus.REQUEST, title: 'Заявки', color: 'text-amber-600', icon: Clock },
  { id: BookingStatus.CONFIRMED, title: 'Подтверждено', color: 'text-teal-600', icon: CheckCircle2 },
  { id: BookingStatus.COMPLETED, title: 'Завершено', color: 'text-slate-600', icon: CheckCircle2 },
  { id: BookingStatus.CANCELLED, title: 'Отмена', color: 'text-red-600', icon: XCircle },
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

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Доска</h2>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {COLUMNS.map((col) => {
            const items = getColumnBookings(col.id as BookingStatus);
            const isDragOver = dragOverColumn === col.id;
            const Icon = col.icon;

            return (
              <div 
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id as BookingStatus)}
                onDrop={(e) => handleDrop(e, col.id as BookingStatus)}
                className={`flex-1 min-w-[280px] rounded-lg border bg-slate-100/50 dark:bg-slate-900/50 flex flex-col ${
                  isDragOver ? 'border-primary ring-1 ring-primary' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="p-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-lg">
                   <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${col.color}`} />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{col.title}</h3>
                   </div>
                   <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                     {items.length}
                   </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                   {items.map(booking => {
                     const total = calculateTotal(booking);

                     return (
                       <div
                         key={booking.id}
                         draggable
                         onDragStart={(e) => handleDragStart(e, booking.id)}
                         className="group relative rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md active:scale-95 dark:border-slate-800 dark:bg-slate-950 cursor-grab active:cursor-grabbing"
                       >
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                   {booking.dogName[0]}
                               </div>
                               <div>
                                  <button onClick={() => setSelectedClientName(booking.dogName)} className="text-sm font-semibold hover:underline">
                                      {booking.dogName}
                                  </button>
                                  <p className="text-[10px] text-slate-500">{booking.breed}</p>
                               </div>
                            </div>
                         </div>
                         
                         <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                               <Calendar className="h-3 w-3" />
                               <span>{formatDate(booking.checkIn)}</span>
                            </div>
                            <div className="font-medium text-slate-900 dark:text-slate-50">
                               {total.toLocaleString()} ₽
                            </div>
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