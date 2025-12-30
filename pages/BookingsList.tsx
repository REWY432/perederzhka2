import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../types';
import BookingCard from '../components/BookingCard';
import { EmptyState, BookingCardSkeleton, ConfirmDialog } from '../components/ui';
import { cn } from '../utils/helpers';

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed';

interface BookingsListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  isLoading?: boolean;
  deletingId?: string | null;
}

const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
  deletingId = null
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Filter by status
    switch (filter) {
      case 'pending':
        result = result.filter(b => b.status === BookingStatus.REQUEST || b.status === BookingStatus.WAITLIST);
        break;
      case 'confirmed':
        result = result.filter(b => b.status === BookingStatus.CONFIRMED);
        break;
      case 'completed':
        result = result.filter(b => b.status === BookingStatus.COMPLETED);
        break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.dogName.toLowerCase().includes(query) ||
        b.breed.toLowerCase().includes(query) ||
        b.ownerName?.toLowerCase().includes(query)
      );
    }

    // Sort by check-in date (newest first)
    result.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

    return result;
  }, [bookings, filter, searchQuery]);

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filter.all') },
    { key: 'pending', label: t('filter.pending') },
    { key: 'confirmed', label: t('filter.confirmed') },
    { key: 'completed', label: t('filter.completed') }
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <div className="w-32 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('nav.bookings')}
        </h1>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              isSearchOpen
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700'
            )}
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                autoFocus
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {filterButtons.map(({ key, label }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(key)}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
              filter === key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-none'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800'
            )}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Bookings List */}
      <AnimatePresence mode="popLayout">
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onEdit={onEdit}
                onDelete={id => setDeleteConfirm(id)}
                isDeleting={deletingId === booking.id}
                index={index}
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            type="noBookings"
            className="py-20"
          />
        ) : (
          <EmptyState
            type="noResults"
            onAction={() => {
              setFilter('all');
              setSearchQuery('');
            }}
            className="py-20"
          />
        )}
      </AnimatePresence>

      {/* Results count */}
      {filteredBookings.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-slate-400"
        >
          {filteredBookings.length} {filteredBookings.length === 1 ? 'бронирование' : 'бронирований'}
        </motion.p>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title={t('booking.confirmDelete')}
        description={t('booking.deleteWarning')}
        confirmText={t('common.delete')}
        danger
      />
    </div>
  );
};

export default BookingsList;
