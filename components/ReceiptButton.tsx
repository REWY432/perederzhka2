import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Printer, Download, Share2, X, CreditCard, Banknote, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, AppSettings } from '../types';
import { printReceipt, downloadReceiptHTML, shareReceipt } from '../services/receiptGenerator';

interface ReceiptButtonProps {
  booking: Booking;
  settings: AppSettings;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

const ReceiptButton: React.FC<ReceiptButtonProps> = ({ booking, settings }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const paymentMethods = [
    { id: 'cash' as const, label: t('receipt.cash'), icon: Banknote },
    { id: 'card' as const, label: t('receipt.card'), icon: CreditCard },
    { id: 'transfer' as const, label: t('receipt.transfer'), icon: Wallet },
  ];

  const getPaymentLabel = () => {
    const method = paymentMethods.find(m => m.id === paymentMethod);
    return method?.label || 'Наличные';
  };

  const handlePrint = () => {
    printReceipt({
      booking,
      settings,
      paymentMethod: getPaymentLabel(),
      notes: notes || undefined
    });
  };

  const handleDownload = () => {
    downloadReceiptHTML({
      booking,
      settings,
      paymentMethod: getPaymentLabel(),
      notes: notes || undefined
    });
    setIsOpen(false);
  };

  const handleShare = async () => {
    setIsSharing(true);
    const success = await shareReceipt({
      booking,
      settings,
      paymentMethod: getPaymentLabel(),
      notes: notes || undefined
    });
    setIsSharing(false);
    
    if (success) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
        title={t('receipt.generate')}
      >
        <Receipt size={18} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
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
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Receipt size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {t('receipt.title')}
                    </h3>
                    <p className="text-sm text-slate-500">{booking.dogName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    {t('receipt.paymentMethod')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === method.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <Icon 
                            size={20} 
                            className={paymentMethod === method.id ? 'text-blue-600' : 'text-slate-400'} 
                          />
                          <span className={`text-xs font-medium ${
                            paymentMethod === method.id ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {method.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('receipt.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t('receipt.notesPlaceholder')}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Printer size={18} />
                    {t('receipt.print')}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Download size={18} />
                    {t('receipt.download')}
                  </motion.button>
                </div>

                {/* Share button (full width) */}
                {'share' in navigator && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    disabled={isSharing}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    {isSharing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Share2 size={18} />
                        {t('receipt.share')}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReceiptButton;
