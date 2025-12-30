import React, { useMemo } from 'react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal } from '../services/mockBackend';
import { Plus, Bell, Calendar as CalendarIcon, Dog, BarChart3, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  bookings: Booking[];
  maxCapacity: number;
  hotelName?: string;
  onNewBooking: () => void;
}

const Dashboard: React.FC<Props> = ({ bookings, maxCapacity, hotelName, onNewBooking }) => {
  const activeBookings = bookings.filter(b => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED);
  const currentDogs = activeBookings.length;
  const nextMonthCount = bookings.filter(b => {
      const d = new Date(b.checkIn);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return d.getMonth() === nextMonth.getMonth();
  }).length;
  
  const currentRevenue = bookings.reduce((sum, b) => sum + (b.status === BookingStatus.CONFIRMED ? calculateTotal(b) : 0), 0);

  // Simple data for bar chart visualization
  const chartData = [
      { name: '1', val: 400 }, { name: '2', val: 300 }, { name: '3', val: 550 }, 
      { name: '4', val: 450 }, { name: '5', val: 600 }, { name: '6', val: 750 }
  ];

  // Calendar Logic
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const startDayOffset = new Date(today.getFullYear(), today.getMonth(), 1).getDay() - 1; // Mon start

  const getDayStatus = (day: number) => {
     const date = new Date(today.getFullYear(), today.getMonth(), day);
     const count = bookings.filter(b => {
         const s = new Date(b.checkIn);
         const e = new Date(b.checkOut);
         return date >= s && date <= e && b.status === BookingStatus.CONFIRMED;
     }).length;
     
     if (count === 0) return 'empty';
     if (count >= maxCapacity) return 'full';
     return 'partial';
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-start">
          <div>
              <p className="text-slate-500 text-sm mb-1">Welcome back,</p>
              <h1 className="text-3xl font-serif font-bold text-slate-900">{hotelName || 'My Hotel'}</h1>
          </div>
          <div className="flex items-center gap-4">
              <button className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-orange-500 transition-colors">
                  <Bell size={24} />
              </button>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
              </div>
          </div>
      </div>

      {/* Hero Action */}
      <button 
        onClick={onNewBooking}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-3xl shadow-xl shadow-orange-200 flex items-center justify-between group transition-transform hover:scale-[1.02]"
      >
          <span className="font-bold text-lg">New Booking</span>
          <div className="bg-white/20 p-2 rounded-full">
              <Plus size={24} className="text-white" />
          </div>
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
               <div className="flex justify-between items-start">
                   <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                       <Dog size={20} />
                   </div>
                   <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                       <ArrowUpRight size={10} /> +2
                   </span>
               </div>
               <div>
                   <p className="text-slate-500 text-sm">Current Dogs</p>
                   <p className="text-3xl font-bold text-slate-900">{currentDogs}</p>
               </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
               <div className="flex justify-between items-start">
                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                       <CalendarIcon size={20} />
                   </div>
                   <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                       <ArrowUpRight size={10} /> 12%
                   </span>
               </div>
               <div>
                   <p className="text-slate-500 text-sm">Next Month</p>
                   <p className="text-3xl font-bold text-slate-900">{nextMonthCount}</p>
               </div>
          </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <p className="text-slate-500 text-sm mb-1">Revenue (Oct)</p>
                  <h3 className="text-3xl font-serif font-bold text-slate-900">${currentRevenue.toLocaleString()}</h3>
              </div>
              <div className="mb-2">
                   <BarChart3 className="text-orange-500" size={24} />
              </div>
          </div>
          <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <Bar dataKey="val" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#fb923c' : '#fdba74'} />
                        ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Occupancy Calendar Widget */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 pb-8">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif font-bold text-lg">Occupancy</h3>
              <div className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
                  {today.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-6 text-center">
              {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                  <span key={d} className="text-xs text-slate-400 font-medium">{d}</span>
              ))}
              
              {/* Empty slots for start of month */}
              {Array.from({length: startDayOffset > 0 ? startDayOffset : 0}).map((_, i) => <div key={`empty-${i}`} />)}

              {calendarDays.map(day => {
                  const status = getDayStatus(day);
                  const isToday = day === today.getDate();
                  
                  return (
                      <div key={day} className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-medium ${isToday ? 'text-orange-600 font-bold' : 'text-slate-700'}`}>
                              {day}
                          </span>
                          {status === 'full' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          {status === 'partial' && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                          {status === 'empty' && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                      </div>
                  )
              })}
          </div>
      </div>

    </div>
  );
};

export default Dashboard;