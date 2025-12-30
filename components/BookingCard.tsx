import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Edit2, Trash2, Copy, MoreVertical, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../../types';
import { calculateTotal } from '../../services/api';
import { cn, triggerHaptic, formatDateShort } from '../../utils/helpers';
import { QuickActions } from '../ui';
import { useLongPress } from '../../hooks/useDogStay';

interface BookingCardProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (booking: Booking) => void;
  isDeleting?: boolean;
  index?: number;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onEdit,
  onDelete,
  onDuplicate,
  isDeleting = false,
  index = 0
}) => {
  const { t, i18n } = useTranslation();
  const [showActions, setShowActions] = useState(false);

  const longPressProps = useLongPress(() => {
    setShowActions(true);
  }, 500);

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

  const getStatusLabel = (status: BookingStatus) => {
    return t(`status.${status.toLowerCase()}`);
  };

  const total = calculateTotal(booking);

  const actions = [
    {
      icon: Edit2,
      label: t('common.edit'),
      onClick: () => onEdit(booking)
    },
    ...(onDuplicate ? [{
      icon: Copy,
      label: 'Дублировать',
      onClick: () => onDuplicate(booking)
    }] : []),
    {
      icon: Trash2,
      label: t('common.delete'),
      onClick: () => onDelete(booking.id),
      danger: true
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative',
        'transition-all duration-200',
        isDeleting && 'opacity-50 scale-98'
      )}
      {...longPressProps}
    >
      {/* Top Row: Dog Info & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full overflow-hidden flex items-center justify-center"
          >
            {booking.photoUrl ? (
              <img src={booking.photoUrl} alt={booking.dogName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {booking.dogName[0]?.toUpperCase()}
              </span>
            )}
          </motion.div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {booking.dogName}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {booking.breed}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
            getStatusColor(booking.status)
          )}>
            {getStatusLabel(booking.status)}
          </span>
          
          {/* More Actions Button */}
          <button
            onClick={() => setShowActions(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={t('a11y.openMenu')}
          >
            <MoreVertical size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Middle Row: Dates */}
      <div className="flex items-center gap-8 mb-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
            {t('booking.checkIn')}
          </p>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Calendar size={16} className="text-orange-500" />
            {formatDateShort(booking.checkIn, i18n.language)}
          </div>
        </div>
        <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
            {t('booking.checkOut')}
          </p>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Calendar size={16} className="text-orange-500" />
            {formatDateShort(booking.checkOut, i18n.language)}
          </div>
        </div>
      </div>

      {/* Tags */}
      {booking.tags && booking.tags.length > 0 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {booking.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg"
            >
              {t(`tags.${tag}`)}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Row: Price & Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onEdit(booking);
            }}
            className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
            aria-label={t('a11y.editBooking')}
          >
            <Edit2 size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onDelete(booking.id);
            }}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            aria-label={t('a11y.deleteBooking')}
          >
            <Trash2 size={18} />
          </motion.button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-800 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-slate-800 text-[10px] font-bold">
            ₽
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Quick Actions Menu */}
      <QuickActions
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        actions={actions}
        position="top"
      />
    </motion.div>
  );
};

export default BookingCard;
