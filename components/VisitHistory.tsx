import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp, Award, Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, calculateDays, formatDate } from '../services/mockBackend';

interface VisitHistoryProps {
  dogName: string;
  bookings: Booking[];
  isOpen: boolean;
  onClose: () => void;
}

const VisitHistory: React.FC<VisitHistoryProps> = ({
  dogName,
  bookings,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  
  // Filter all bookings for this dog
  const dogBookings = useMemo(() => {
    return bookings
      .filter(b => b.dogName.toLowerCase() === dogName.toLowerCase())
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [bookings, dogName]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = dogBookings.filter(b => 
      b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED
    );
    
    const totalVisits = completed.length;
    const totalRevenue = completed.reduce((sum, b) => sum + calculateTotal(b), 0);
    const totalDays = completed.reduce((sum, b) => sum + calculateDays(b.checkIn, b.checkOut), 0);
    const avgStay = totalVisits > 0 ? Math.round(totalDays / totalVisits) : 0;
    const totalDamage = dogBookings.reduce((sum, b) => sum + (b.damageCost || 0), 0);
    
    // First and last visit
    const firstVisit = completed.length > 0 
      ? completed[completed.length - 1].checkIn 
      : null;
    const lastVisit = completed.length > 0 
      ? completed[0].checkOut 
      : null;
    
    // VIP status: 5+ visits or 50k+ revenue
    const isVip = totalVisits >= 5 || totalRevenue >= 50000;
    
    // Loyalty level
    let loyaltyLevel = 'new';
    if (totalVisits >= 10) loyaltyLevel = 'platinum';
    else if (totalVisits >= 5) loyaltyLevel = 'gold';
    else if (totalVisits >= 3) loyaltyLevel = 'silver';
    else if (totalVisits >= 1) loyaltyLevel = 'bronze';
    
    return {
      totalVisits,
      totalRevenue,
      totalDays,
      avgStay,
      totalDamage,
      firstVisit,
      lastVisit,
      isVip,
      loyaltyLevel
    };
  }, [dogBookings]);

  // Get breed from first booking
  const breed = dogBookings[0]?.breed || t('common.unknown');
  const size = dogBookings[0]?.size || 'MEDIUM';

  const getLoyaltyColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'from-purple-500 to-indigo-600';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'silver': return 'from-slate-300 to-slate-400';
      case 'bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-slate-200 to-slate-300';
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case BookingStatus.CONFIRMED: return 'bg-blue-100 text-blue-700';
      case BookingStatus.REQUEST: return 'bg-orange-100 text-orange-700';
      case BookingStatus.CANCELLED: return 'bg-red-100 text-red-700';
      case BookingStatus.WAITLIST: return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar with loyalty badge */}
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLoyaltyColor(stats.loyaltyLevel)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {dogName[0]?.toUpperCase()}
                  </div>
                  {stats.isVip && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                      <Award size={14} className="text-yellow-900" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {dogName}
                    {stats.isVip && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                        VIP
                      </span>
                    )}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    {breed} • {t(`size.${size.toLowerCase()}`)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {t('history.clientSince')}: {stats.firstVisit ? formatDate(stats.firstVisit) : '-'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar size={16} />
                <span className="text-xs font-medium">{t('history.totalVisits')}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalVisits}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <DollarSign size={16} />
                <span className="text-xs font-medium">{t('history.totalRevenue')}</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalRevenue.toLocaleString()} ₽
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock size={16} />
                <span className="text-xs font-medium">{t('history.avgStay')}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.avgStay} {t('common.days')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <TrendingUp size={16} />
                <span className="text-xs font-medium">{t('history.totalDays')}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalDays}
              </p>
            </div>
          </div>

          {/* Damage warning */}
          {stats.totalDamage > 0 && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {t('history.damageTotal')}: {stats.totalDamage.toLocaleString()} ₽
              </span>
            </div>
          )}

          {/* Visit History List */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              {t('history.visitHistory')}
            </h3>

            <div className="space-y-3">
              {dogBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {calculateDays(booking.checkIn, booking.checkOut)} {t('common.days')} • {booking.pricePerDay.toLocaleString()} ₽/{t('common.day')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(booking.damageCost ?? 0) > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg">
                        -{booking.damageCost} ₽
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                      {t(`status.${booking.status.toLowerCase()}`)}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {calculateTotal(booking).toLocaleString()} ₽
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                </motion.div>
              ))}

              {dogBookings.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p>{t('history.noVisits')}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VisitHistory;
