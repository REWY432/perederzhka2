import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../types';
import { calculateDays } from '../services/mockBackend';

interface QuickExtendProps {
  booking: Booking;
  allBookings: Booking[];
  maxCapacity: number;
  onExtend: (bookingId: string, newCheckOut: string) => void;
}

const QuickExtendButton: React.FC<QuickExtendProps> = ({
  booking,
  allBookings,
  maxCapacity,
  onExtend
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(1);
  const [checking, setChecking] = useState(false);

  // Calculate new checkout date
  const getNewCheckOut = (days: number) => {
    const date = new Date(booking.checkOut);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Check if extension is available
  const checkAvailability = (days: number): { available: boolean; conflict: string | null } => {
    const newCheckOut = getNewCheckOut(days);
    const currentCheckOut = new Date(booking.checkOut);
    
    const confirmedBookings = allBookings.filter(b => 
      b.id !== booking.id && 
      (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
    );

    // Check each new day
    for (let d = new Date(currentCheckOut); d <= new Date(newCheckOut); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      const occupancy = confirmedBookings.filter(b => {
        const bStart = new Date(b.checkIn);
        const bEnd = new Date(b.checkOut);
        return new Date(dateStr) >= bStart && new Date(dateStr) <= bEnd;
      }).length;

      // Current booking doesn't count, so we check if adding it would exceed capacity
      if (occupancy >= maxCapacity) {
        return { available: false, conflict: dateStr };
      }
    }

    return { available: true, conflict: null };
  };

  const availability = checkAvailability(daysToAdd);
  const newCheckOut = getNewCheckOut(daysToAdd);
  const newTotalDays = calculateDays(booking.checkIn, newCheckOut);
  const additionalCost = daysToAdd * booking.pricePerDay;

  const handleExtend = () => {
    if (availability.available) {
      setChecking(true);
      setTimeout(() => {
        onExtend(booking.id, newCheckOut);
        setIsExpanded(false);
        setDaysToAdd(1);
        setChecking(false);
      }, 300);
    }
  };

  // Quick +1 day without opening panel
  const handleQuickAdd = () => {
    const quick = checkAvailability(1);
    if (quick.available) {
      onExtend(booking.id, getNewCheckOut(1));
    } else {
      setIsExpanded(true);
    }
  };

  // Don't show for completed/cancelled bookings
  if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
    return null;
  }

  return (
    <div className="relative">
      {/* Quick +1 Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleQuickAdd}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsExpanded(true);
        }}
        className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors"
        title={t('booking.extendOneDay')}
      >
        <Plus size={18} />
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsExpanded(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-72"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t('booking.extendStay')}
                </h4>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              {/* Current info */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-4 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>{t('booking.currentCheckout')}:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(booking.checkOut).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              {/* Days selector */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDaysToAdd(Math.max(1, daysToAdd - 1))}
                  disabled={daysToAdd <= 1}
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center disabled:opacity-30"
                >
                  <Minus size={18} />
                </motion.button>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    +{daysToAdd}
                  </p>
                  <p className="text-xs text-slate-500">
                    {daysToAdd === 1 ? t('common.day') : t('common.days')}
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDaysToAdd(daysToAdd + 1)}
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center"
                >
                  <Plus size={18} />
                </motion.button>
              </div>

              {/* New checkout date */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl mb-4">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                  <Calendar size={16} />
                  <span className="text-xs font-medium">{t('booking.newCheckout')}</span>
                </div>
                <p className="font-bold text-orange-700 dark:text-orange-300">
                  {new Date(newCheckOut).toLocaleDateString('ru-RU', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                  {t('booking.totalDays')}: {newTotalDays}
                </p>
              </div>

              {/* Availability check */}
              {!availability.available && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t('booking.noCapacityOn')} {new Date(availability.conflict!).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}

              {/* Additional cost */}
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('booking.additionalCost')}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  +{additionalCost.toLocaleString()} ₽
                </span>
              </div>

              {/* Confirm button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExtend}
                disabled={!availability.available || checking}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                  availability.available
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {checking ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Check size={18} />
                    {t('booking.confirmExtension')}
                  </>
                )}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickExtendButton;
