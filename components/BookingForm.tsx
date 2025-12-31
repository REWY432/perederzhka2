import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Dog, Check, Loader2, Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus, DogSize, PRICES } from '../types';
import { calculateDays } from '../services/mockBackend';

interface BookingFormProps {
  isOpen?: boolean;
  initialData?: Booking;
  allBookings: Booking[];
  maxCapacity: number;
  onClose: () => void;
  onSave: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
  isLoading?: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (navigator.vibrate) {
    const patterns = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(patterns[type]);
  }
};

const BookingForm: React.FC<BookingFormProps> = ({
  isOpen = true,
  initialData,
  allBookings,
  maxCapacity,
  onClose,
  onSave,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'createdAt'>>({
    dogName: '',
    breed: '',
    size: DogSize.SMALL,
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pricePerDay: PRICES[DogSize.SMALL],
    expenses: [],
    diaperCost: 0,
    damageCost: 0,
    comment: '',
    tags: [],
    checklist: [],
    vaccineExpires: '',
    photoUrl: '',
    status: BookingStatus.REQUEST,
    totalCost: 0
  });

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const days = useMemo(() => 
    calculateDays(formData.checkIn, formData.checkOut),
    [formData.checkIn, formData.checkOut]
  );

  const totalPrice = useMemo(() => 
    days * formData.pricePerDay,
    [days, formData.pricePerDay]
  );

  const canGoNext = useMemo(() => {
    switch (step) {
      case 1:
        return (formData.dogName || '').trim().length >= 2 && (formData.breed || '').trim().length >= 2;
      case 2:
        return formData.checkIn && formData.checkOut && days > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, formData, days]);

  const handleNext = () => {
    if (step < totalSteps && canGoNext) {
      triggerHaptic('light');
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      triggerHaptic('light');
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    triggerHaptic('medium');
    onSave({ ...formData, totalCost: totalPrice });
  };

  const SizeCard = ({ size, label, price }: { size: DogSize; label: string; price: number }) => {
    const isSelected = formData.size === size;
    return (
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setFormData(prev => ({ ...prev, size, pricePerDay: price }));
        }}
        className={cn(
          'flex items-center justify-between p-4 rounded-2xl border-2 transition-all w-full',
          isSelected
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100'
            : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isSelected ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' : 'bg-white dark:bg-slate-700 text-slate-400'
          )}>
            <Dog size={size === DogSize.SMALL ? 16 : size === DogSize.MEDIUM ? 20 : 24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">{label}</p>
            <p className="text-xs opacity-70">
              {size === DogSize.SMALL ? t('booking.upTo10kg') : size === DogSize.MEDIUM ? t('booking.upTo25kg') : t('booking.unlimited')}
            </p>
          </div>
        </div>
        <span className="font-bold">{price.toLocaleString()} ₽</span>
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {step === 1 ? <X size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
          {initialData ? t('booking.edit') : t('booking.new')}
        </h2>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < step ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Pet Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider opacity-50">
                {t('booking.petDetails')}
              </h3>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  {t('booking.dogName')}
                </label>
                <input
                  type="text"
                  value={formData.dogName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, dogName: e.target.value }))}
                  placeholder="e.g. Buddy"
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  {t('booking.breed')}
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  placeholder="Golden Retriever"
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider opacity-50">
                  {t('booking.breedSize')}
                </h4>
                <SizeCard size={DogSize.SMALL} label={t('booking.smallBreed')} price={PRICES[DogSize.SMALL]} />
                <SizeCard size={DogSize.MEDIUM} label={t('booking.mediumBreed')} price={PRICES[DogSize.MEDIUM]} />
                <SizeCard size={DogSize.LARGE} label={t('booking.largeBreed')} price={PRICES[DogSize.LARGE]} />
              </div>
            </motion.div>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider opacity-50">
                {t('booking.selectDates')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    {t('booking.checkIn')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    {t('booking.checkOut')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              {days > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl"
                >
                  <p className="text-orange-700 dark:text-orange-300 font-medium">
                    {days} {t('booking.days')}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider opacity-50">
                {t('booking.confirm')}
              </h3>

              {/* Summary Card */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-3xl border border-orange-100 dark:border-orange-800 space-y-4">
                <div className="flex justify-between items-center text-orange-900/60 dark:text-orange-300/60">
                  <span>{t('booking.dogName')}</span>
                  <span className="font-bold text-orange-900 dark:text-orange-100">{formData.dogName}</span>
                </div>
                <div className="flex justify-between items-center text-orange-900/60 dark:text-orange-300/60">
                  <span>{t('booking.breed')}</span>
                  <span className="font-bold text-orange-900 dark:text-orange-100">{formData.breed}</span>
                </div>
                <div className="flex justify-between items-center text-orange-900/60 dark:text-orange-300/60">
                  <span>{t('booking.days')}</span>
                  <span>{days}</span>
                </div>
                <div className="flex justify-between items-center text-orange-900/60 dark:text-orange-300/60">
                  <span>{t('booking.pricePerDay')}</span>
                  <span>{formData.pricePerDay.toLocaleString()} ₽</span>
                </div>
                <div className="h-px bg-orange-200 dark:bg-orange-700 my-2" />
                <div className="flex justify-between items-center text-xl font-bold text-orange-900 dark:text-orange-100">
                  <span>{t('booking.total')}</span>
                  <span>{totalPrice.toLocaleString()} ₽</span>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  {t('booking.comment')}
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder={t('booking.commentPlaceholder')}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all resize-none"
                />
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider opacity-50">
                  {t('booking.status')}
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[BookingStatus.REQUEST, BookingStatus.CONFIRMED].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, status: s }))}
                      className={cn(
                        'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                        formData.status === s
                          ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {t(`status.${s.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800">
        {step < totalSteps ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2',
              canGoNext
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            )}
          >
            {t('common.next')} <ArrowRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Check size={20} />
            )}
            {initialData ? t('common.save') : t('booking.create')}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
