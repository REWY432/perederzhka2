import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface Action {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface QuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Action[];
  position?: 'top' | 'bottom';
}

const QuickActions: React.FC<QuickActionsProps> = ({
  isOpen,
  onClose,
  actions,
  position = 'bottom'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Actions Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? 20 : -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? 20 : -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'absolute z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[200px]',
              position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
              'right-0'
            )}
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3 transition-colors',
                    action.danger
                      ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <Icon size={18} />
                  <span className="font-medium">{action.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickActions;
