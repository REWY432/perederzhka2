import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Edit2, Trash2, Copy, MoreVertical, Check, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus, AppSettings } from '../types';
import { calculateTotal } from '../services/mockBackend';
import { Calendar as CalendarIcon } from 'lucide-react';
import { printReceipt } from '../services/receiptGenerator';

interface BookingCardProps {
  booking: Booking;
  settings?: AppSettings;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: BookingStatus) => void;
  isDeleting?: boolean;
  index?: number;
}

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (navigator.vibrate) {
    const patterns = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(patterns[type]);
  }
};

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  settings,
  onEdit,
  onDelete,
  onStatusChange,
  isDeleting = false,
  index = 0
}) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  
  const total = calculateTotal(booking);

  const handlePrintReceipt = () => {
    triggerHaptic('light');
    printReceipt({
      booking,
      settings: settings || { hotelName: 'DogStay Hotel', maxCapacity: 10 },
      paymentMethod: 'Наличные'
    });
  };

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

  const handleEdit = () => {
    triggerHaptic('light');
    onEdit(booking);
  };

  const handleDelete = () => {
    triggerHaptic('medium');
    onDelete(booking.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDeleting ? 0.5 : 1, y: 0, scale: isDeleting ? 0.98 : 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800',
        'transition-all hover:shadow-md',
        isDeleting && 'pointer-events-none'
      )}
    >
      {/* Top Row: Dog Info & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            {booking.photoUrl ? (
              <img src={booking.photoUrl} alt={booking.dogName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-serif font-bold text-white">
                {booking.dogName[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {booking.dogName}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {booking.breed}
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={cn(
          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
          getStatusColor(booking.status)
        )}>
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
            <CalendarIcon size={16} className="text-orange-500" />
            {formatDateShort(booking.checkIn)}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1 tracking-wider">
            {t('booking.checkOut')}
          </p>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <CalendarIcon size={16} className="text-orange-500" />
            {formatDateShort(booking.checkOut)}
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
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEdit}
            className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
            aria-label={t('common.edit')}
          >
            <Edit2 size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label={t('common.delete')}
          >
            <Trash2 size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrintReceipt}
            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-label={t('receipt.print')}
            title="Печать чека"
          >
            <Receipt size={18} />
          </motion.button>
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
  );
};

export default BookingCard;
