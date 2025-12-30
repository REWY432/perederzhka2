import React, { useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, calculateDays, formatDate } from '../services/mockBackend';
import { X, Trophy, AlertTriangle, Calendar, Image as ImageIcon } from 'lucide-react';

interface Props {
  dogName: string;
  allBookings: Booking[];
  onClose: () => void;
}

const ClientCard: React.FC<Props> = ({ dogName, allBookings, onClose }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'gallery'>('history');

  // Filter history for this dog (case insensitive)
  const history = allBookings.filter(b => b.dogName.toLowerCase() === dogName.toLowerCase())
                             .sort((a,b) => b.createdAt - a.createdAt);

  const completed = history.filter(b => b.status === BookingStatus.COMPLETED);
  
  // Stats
  const totalVisits = completed.length;
  const totalSpent = completed.reduce((sum, b) => sum + calculateTotal(b), 0);
  const totalDamage = history.reduce((sum, b) => sum + (b.damageCost || 0), 0);
  const lastVisit = history.length > 0 ? history[0].checkOut : null;
  const breed = history[0]?.breed || 'Неизвестно';
  
  // Tags aggregation
  const allTags = Array.from(new Set(history.flatMap(b => b.tags || [])));
  const photos = history.map(b => b.photoUrl).filter(Boolean) as string[];

  // Logic for badges
  const isVip = totalVisits >= 3 || totalSpent > 50000;
  const isProblematic = totalDamage > 0 || allTags.includes('Агрессия');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {dogName[0]}
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {dogName}
                        {isVip && <span className="bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-400/30 flex items-center gap-1"><Trophy size={12}/> VIP</span>}
                        {isProblematic && <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20 flex items-center gap-1"><AlertTriangle size={12}/> Внимание</span>}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{breed} • Последний визит: {lastVisit ? formatDate(lastVisit) : '-'}</p>
                    <div className="flex gap-2 mt-2">
                        {allTags.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-white/50 dark:bg-black/30 rounded text-xs font-medium text-gray-600 dark:text-gray-300 border border-black/5 dark:border-white/10">{t}</span>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">LTV (Всего)</p>
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{totalSpent.toLocaleString()} ₽</p>
                </div>
                <div className="text-right border-l border-gray-300 dark:border-gray-700 pl-4">
                    <p className="text-xs text-gray-500 uppercase font-bold">Визитов</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalVisits}</p>
                </div>
                <button onClick={onClose} className="ml-4 p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                    <X size={24} className="text-gray-600 dark:text-gray-300"/>
                </button>
            </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-8">
            <button onClick={() => setActiveTab('history')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                История заездов
            </button>
            <button onClick={() => setActiveTab('gallery')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'gallery' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                Галерея ({photos.length})
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20 custom-scrollbar">
            
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {history.map(item => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-transform hover:scale-[1.01]">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${item.status === BookingStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{formatDate(item.checkIn)} — {formatDate(item.checkOut)}</p>
                                    <p className="text-xs text-gray-500">{calculateDays(item.checkIn, item.checkOut)} дней • {item.status}</p>
                                </div>
                            </div>
                            
                            {item.damageCost > 0 && (
                                <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1">
                                    <AlertTriangle size={14} />
                                    Ущерб: {item.damageCost} ₽
                                </div>
                            )}

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{calculateTotal(item).toLocaleString()} ₽</p>
                                    <p className="text-xs text-gray-400">Итого</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="text-center text-gray-500 py-10">Истории пока нет.</div>}
                </div>
            )}

            {activeTab === 'gallery' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((url, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden shadow-md group relative">
                            <img src={url} alt={`Photo ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        </div>
                    ))}
                    {photos.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                            <ImageIcon size={48} className="opacity-50" />
                            <p>Фотографий еще не загружено</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
