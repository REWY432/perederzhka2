import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, triggerHaptic } from '../../utils/helpers';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  danger = false,
  loading = false
}) => {
  const { t } = useTranslation();

  const handleConfirm = async () => {
    triggerHaptic(danger ? 'heavy' : 'medium');
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl">
              {/* Icon */}
              <div
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center mb-4',
                  danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                )}
              >
                {danger ? (
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
                ) : (
                  <HelpCircle className="text-orange-600 dark:text-orange-400" size={28} />
                )}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h3>
              {description && (
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {cancelText || t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={cn(
                    'flex-1 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
                    danger
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  )}
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {confirmText || t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
