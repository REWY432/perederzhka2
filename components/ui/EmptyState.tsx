import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, BarChart2, Image, Dog, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/helpers';

type EmptyStateType = 'noBookings' | 'noResults' | 'noReports' | 'noPhotos';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  className?: string;
}

const configs: Record<EmptyStateType, { icon: LucideIcon; color: string }> = {
  noBookings: { icon: Calendar, color: 'bg-orange-100 text-orange-600' },
  noResults: { icon: Search, color: 'bg-blue-100 text-blue-600' },
  noReports: { icon: BarChart2, color: 'bg-purple-100 text-purple-600' },
  noPhotos: { icon: Image, color: 'bg-slate-100 text-slate-500' }
};

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, className }) => {
  const { t } = useTranslation();
  const config = configs[type];
  const Icon = config.icon;

  const getActionText = () => {
    switch (type) {
      case 'noBookings':
        return t('empty.createFirst');
      case 'noResults':
        return t('empty.resetFilters');
      default:
        return null;
    }
  };

  const actionText = getActionText();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mb-6',
          config.color
        )}
      >
        <Icon size={32} />
      </motion.div>

      {/* Decorative Elements */}
      <div className="relative mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-4 -left-8 w-3 h-3 bg-orange-200 rounded-full"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute -bottom-2 -right-6 w-2 h-2 bg-blue-200 rounded-full"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-0 right-4 w-4 h-4 bg-purple-100 rounded-full"
        />
      </div>

      {/* Text */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {t(`empty.${type}`)}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        {t(`empty.${type}Desc`)}
      </p>

      {/* Action Button */}
      {actionText && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-orange-200 dark:shadow-none"
        >
          {actionText}
        </motion.button>
      )}

      {/* Fun decorative dog illustration */}
      {type === 'noBookings' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-10 right-10 text-slate-300"
        >
          <Dog size={120} strokeWidth={1} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
