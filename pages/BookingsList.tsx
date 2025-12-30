import React, { useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, formatDate } from '../services/mockBackend';
import { Search, Filter, Calendar, Edit2, Trash2 } from 'lucide-react';

interface Props {
  bookings: Booking[];
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}

const BookingsList: React.FC<Props> = ({ bookings, onEdit, onDelete }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredBookings = bookings.filter(b => {
      const matchSearch = b.dogName.toLowerCase().includes(search.toLowerCase());
      if (filter === 'ALL') return matchSearch;
      if (filter === 'PENDING') return matchSearch && b.status === BookingStatus.REQUEST;
      if (filter === 'CONFIRMED') return matchSearch && b.status === BookingStatus.CONFIRMED;
      return matchSearch;
  });

  const getStatusColor = (status: BookingStatus) => {
      switch(status) {
          case BookingStatus.CONFIRMED: return 'bg-green-100 text-green-700';
          case BookingStatus.REQUEST: return 'bg-orange-100 text-orange-700';
          case BookingStatus.CANCELLED: return 'bg-red-100 text-red-700';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Header & Search */}
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Bookings</h1>
          <div className="flex gap-3">
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                  <Search size={20} />
              </button>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
              </div>
          </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'ALL' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
              All Bookings
          </button>
          <button 
            onClick={() => setFilter('PENDING')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'PENDING' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
              Pending
          </button>
          <button 
            onClick={() => setFilter('CONFIRMED')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'CONFIRMED' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
              Confirmed
          </button>
          <button className="w-10 h-10 min-w-[2.5rem] bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
             <Filter size={18} />
          </button>
      </div>

      {/* Booking Cards List */}
      <div className="space-y-4">
          {filteredBookings.map(booking => (
              <div key={booking.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                  {/* Top Row: Dog Info & Status */}
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                             {/* Placeholder for Dog Image */}
                             <span className="text-xl font-serif font-bold text-slate-400">{booking.dogName[0]}</span>
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-slate-900 leading-tight">{booking.dogName}</h3>
                              <p className="text-slate-500 text-sm font-medium">{booking.breed}</p>
                          </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                          {booking.status}
                      </span>
                  </div>

                  {/* Middle Row: Dates */}
                  <div className="flex items-center gap-8">
                      <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Check-in</p>
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                              <Calendar size={16} className="text-orange-500"/>
                              {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                      </div>
                      <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Check-out</p>
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                              <Calendar size={16} className="text-orange-500"/>
                              {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                      </div>
                  </div>

                  {/* Bottom Row: Price & Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                      <div className="flex gap-2">
                         <button onClick={() => onEdit(booking)} className="p-2 text-slate-400 hover:text-orange-500 transition-colors">
                             <Edit2 size={18} />
                         </button>
                         <button onClick={() => onDelete(booking.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                             <Trash2 size={18} />
                         </button>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-white text-[10px]">
                             $
                          </div>
                          <p className="text-xl font-bold text-slate-900">${calculateTotal(booking).toFixed(2)}</p>
                      </div>
                  </div>
              </div>
          ))}

          {filteredBookings.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                  <p>No bookings found matching your filters.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default BookingsList;