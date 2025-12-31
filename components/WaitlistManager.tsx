import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Calendar, Bell, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../types';
import { calculateTotal, calculateDays, formatDate } from '../services/mockBackend';

interface WaitlistManagerProps {
  bookings: Booking[];
  maxCapacity: number;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onNotify?: (booking: Booking, message: string) => void;
}

interface AvailabilityInfo {
  booking: Booking;
  canConfirm: boolean;
  availableSpots: number;
  conflictDates: string[];
}

const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  bookings,
  maxCapacity,
  onConfirm,
  onCancel,
  onNotify
}) => {
  const { t } = useTranslation();

  // Get waitlist bookings
  const waitlistBookings = useMemo(() => {
    return bookings
      .filter(b => b.status === BookingStatus.WAITLIST)
      .sort((a, b) => a.createdAt - b.createdAt); // First come, first served
  }, [bookings]);

  // Check availability for each waitlist booking
  const availabilityInfo = useMemo((): AvailabilityInfo[] => {
    const confirmedBookings = bookings.filter(b => 
      b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED
    );

    return waitlistBookings.map(waitlistBooking => {
      const startDate = new Date(waitlistBooking.checkIn);
      const endDate = new Date(waitlistBooking.checkOut);
      
      let minAvailable = maxCapacity;
      const conflictDates: string[] = [];

      // Check each day in the booking range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Count confirmed bookings for this date
        const occupancy = confirmedBookings.filter(b => {
          const bStart = new Date(b.checkIn);
          const bEnd = new Date(b.checkOut);
          return d >= bStart && d <= bEnd;
        }).length;

        const available = maxCapacity - occupancy;
        
        if (available < minAvailable) {
          minAvailable = available;
        }
        
        if (available <= 0) {
          conflictDates.push(dateStr);
        }
      }

      return {
        booking: waitlistBooking,
        canConfirm: minAvailable > 0,
        availableSpots: minAvailable,
        conflictDates
      };
    });
  }, [waitlistBookings, bookings, maxCapacity]);

  // Stats
  const stats = useMemo(() => {
    const total = waitlistBookings.length;
    const canConfirmNow = availabilityInfo.filter(a => a.canConfirm).length;
    const potentialRevenue = waitlistBookings.reduce((sum, b) => sum + calculateTotal(b), 0);
    
    return { total, canConfirmNow, potentialRevenue };
  }, [waitlistBookings, availabilityInfo]);

  const handleConfirm = (booking: Booking) => {
    onConfirm(booking.id);
    
    // Optional: Send notification
    if (onNotify) {
      const message = t('waitlist.confirmationMessage', {
        dogName: booking.dogName,
        checkIn: formatDate(booking.checkIn),
        checkOut: formatDate(booking.checkOut)
      });
      onNotify(booking, message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Clock size={16} />
            <span className="text-xs font-medium">{t('waitlist.inQueue')}</span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {stats.total}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle size={16} />
            <span className="text-xs font-medium">{t('waitlist.canConfirm')}</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {stats.canConfirmNow}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-medium">{t('waitlist.potentialRevenue')}</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.potentialRevenue.toLocaleString()} ₽
          </p>
        </div>
      </div>

      {/* Waitlist Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {t('waitlist.queue')}
        </h3>

        <AnimatePresence>
          {availabilityInfo.map(({ booking, canConfirm, availableSpots, conflictDates }, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 transition-colors ${
                canConfirm 
                  ? 'border-green-200 dark:border-green-800' 
                  : 'border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Queue position */}
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                    #{index + 1}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {booking.dogName}
                    </h4>
                    <p className="text-sm text-slate-500">{booking.breed}</p>
                  </div>
                </div>

                {/* Availability Badge */}
                {canConfirm ? (
                  <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-medium">
                    <CheckCircle size={14} />
                    {t('waitlist.spotsAvailable', { count: availableSpots })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full font-medium">
                    <XCircle size={14} />
                    {t('waitlist.noSpots')}
                  </span>
                )}
              </div>

              {/* Dates & Price */}
              <div className="flex items-center gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar size={16} className="text-orange-500" />
                  <span>
                    {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                  </span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {calculateDays(booking.checkIn, booking.checkOut)} {t('common.days')}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {calculateTotal(booking).toLocaleString()} ₽
                </span>
              </div>

              {/* Conflict warning */}
              {!canConfirm && conflictDates.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {t('waitlist.conflictDates')}: {conflictDates.slice(0, 3).map(d => formatDate(d)).join(', ')}
                    {conflictDates.length > 3 && ` +${conflictDates.length - 3}`}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConfirm(booking)}
                  disabled={!canConfirm}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                    canConfirm
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle size={18} />
                  {t('waitlist.confirm')}
                </motion.button>

                {onNotify && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNotify(booking, t('waitlist.stillWaitingMessage'))}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <Bell size={18} />
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCancel(booking.id)}
                  className="px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400 transition-colors"
                >
                  <XCircle size={18} />
                </motion.button>
              </div>

              {/* Time in queue */}
              <p className="text-xs text-slate-400 mt-3 text-center">
                {t('waitlist.addedOn')}: {new Date(booking.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {waitlistBookings.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <Clock size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">{t('waitlist.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistManager;
