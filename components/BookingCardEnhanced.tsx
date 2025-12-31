import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Edit2, Trash2, User, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus, AppSettings } from '../types';
import { calculateTotal, formatDate } from '../services/mockBackend';

// Import new feature components
import QuickExtendButton from './QuickExtendButton';
import ReceiptButton from './ReceiptButton';
import VisitHistory from './VisitHistory';

interface BookingCardProps {
  booking: Booking;
  allBookings: Booking[];
  maxCapacity: number;
  settings: AppSettings;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onExtend: (bookingId: string, newCheckOut: string) => void;
  isDeleting?: boolean;
  index?: number;
}

const BookingCardEnhanced: React.FC<BookingCardProps> = ({
  booking,
  allBookings,
  maxCapacity,
  settings,
  onEdit,
  onDelete,
  onExtend,
  isDeleting = false,
  index = 0
}) => {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  
  const total = calculateTotal(booking);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case BookingStatus.REQUEST:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case BookingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case BookingStatus.WAITLIST:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Check if this dog has previous visits
  const previousVisits = allBookings.filter(
    b => b.dogName.toLowerCase() === booking.dogName.toLowerCase() && b.id !== booking.id
  ).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isDeleting ? 0.5 : 1, y: 0, scale: isDeleting ? 0.98 : 1 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md ${
          isDeleting ? 'pointer-events-none' : ''
        }`}
      >
        {/* Top Row: Dog Info & Status */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar - clickable to show history */}
            <button
              onClick={() => setShowHistory(true)}
              className="relative w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full overflow-hidden flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
            >
              {booking.photoUrl ? (
                <img src={booking.photoUrl} alt={booking.dogName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-serif font-bold text-white">
                  {booking.dogName[0]?.toUpperCase()}
                </span>
              )}
              
              {/* Visit count badge */}
              {previousVisits > 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                  {previousVisits + 1}
                </div>
              )}
            </button>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                  {booking.dogName}
                </h3>
                {/* History button */}
                {previousVisits > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-blue-500 hover:text-blue-600"
                    title={t('history.title')}
                  >
                    <User size={16} />
                  </button>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {booking.breed}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
            {t(`status.${booking.status.toLowerCase()}`)}
          </span>
        </div>

        {/* Dates Row */}
        <div className="flex items-center gap-8 mb-4">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1 tracking-wider">
              {t('booking.checkIn')}
            </p>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Calendar size={16} className="text-orange-500" />
              {formatDate(booking.checkIn)}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1 tracking-wider">
              {t('booking.checkOut')}
            </p>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Calendar size={16} className="text-orange-500" />
              {formatDate(booking.checkOut)}
            </div>
          </div>
        </div>

        {/* Tags */}
        {booking.tags && booking.tags.length > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {booking.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom Row: Actions & Price */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800">
          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Edit */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(booking)}
              className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
              title={t('common.edit')}
            >
              <Edit2 size={18} />
            </motion.button>

            {/* Delete */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(booking.id)}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title={t('common.delete')}
            >
              <Trash2 size={18} />
            </motion.button>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Quick Extend Button (new feature) */}
            <QuickExtendButton
              booking={booking}
              allBookings={allBookings}
              maxCapacity={maxCapacity}
              onExtend={onExtend}
            />

            {/* Receipt Button (new feature) */}
            <ReceiptButton
              booking={booking}
              settings={settings}
            />
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-800 dark:bg-slate-200 rounded-full flex items-center justify-center text-white dark:text-slate-800 text-[10px] font-bold">
              ₽
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {total.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Visit History Modal */}
      <VisitHistory
        dogName={booking.dogName}
        bookings={allBookings}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
};

export default BookingCardEnhanced;
