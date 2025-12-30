import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Dog, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus, DogSize, PRICES, DogProfile } from '../../types';
import { calculateDays, cn, triggerHaptic } from '../../utils/helpers';
import { checkAvailability } from '../../services/api';
import { Autocomplete, DateRangePicker, BottomSheet } from '../ui';

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
  initialData?: Booking;
  allBookings: Booking[];
  maxCapacity: number;
  isLoading?: boolean;
}

type Step = 'pet' | 'dates' | 'confirm';

const STEPS: Step[] = ['pet', 'dates', 'confirm'];

const BookingForm: React.FC<BookingFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  allBookings,
  maxCapacity,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('pet');
  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'createdAt'>>({
    dogName: '',
    breed: '',
    size: DogSize.SMALL,
    checkIn: '',
    checkOut: '',
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
    totalCost: 0,
    ownerName: '',
    ownerPhone: ''
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          checkIn: initialData.checkIn || '',
          checkOut: initialData.checkOut || ''
        });
        setCurrentStep('pet');
      } else {
        setFormData({
          dogName: '',
          breed: '',
          size: DogSize.SMALL,
          checkIn: '',
          checkOut: '',
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
          totalCost: 0,
          ownerName: '',
          ownerPhone: ''
        });
        setCurrentStep('pet');
      }
    }
  }, [isOpen, initialData]);

  const stepIndex = STEPS.indexOf(currentStep);

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 'pet':
        return formData.dogName.trim().length > 0;
      case 'dates':
        return formData.checkIn && formData.checkOut && formData.checkIn < formData.checkOut;
      case 'confirm':
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const totalDays = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    return calculateDays(formData.checkIn, formData.checkOut);
  }, [formData.checkIn, formData.checkOut]);

  const totalPrice = useMemo(() => {
    return totalDays * formData.pricePerDay;
  }, [totalDays, formData.pricePerDay]);

  const availability = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return { available: true, minRemaining: maxCapacity };
    return checkAvailability(
      formData.checkIn,
      formData.checkOut,
      allBookings,
      maxCapacity,
      initialData?.id
    );
  }, [formData.checkIn, formData.checkOut, allBookings, maxCapacity, initialData]);

  const handleDogSelect = (profile: DogProfile) => {
    setFormData(prev => ({
      ...prev,
      dogName: profile.name,
      breed: profile.breed,
      size: profile.size,
      pricePerDay: PRICES[profile.size],
      tags: profile.tags
    }));
    triggerHaptic('light');
  };

  const handleNext = () => {
    if (!canGoNext) return;
    
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
      triggerHaptic('light');
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
      triggerHaptic('light');
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!availability.available) return;
    triggerHaptic('medium');
    onSave({
      ...formData,
      totalCost: totalPrice
    });
  };

  const SizeCard = ({ size, label, desc, price }: { size: DogSize; label: string; desc: string; price: number }) => {
    const isSelected = formData.size === size;
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setFormData(prev => ({ ...prev, size, pricePerDay: price }));
          triggerHaptic('light');
        }}
        className={cn(
          'flex items-center justify-between p-4 rounded-2xl border-2 transition-all w-full',
          isSelected
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
            : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isSelected ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200' : 'bg-white dark:bg-slate-700 text-slate-400'
          )}>
            <Dog size={size === DogSize.SMALL ? 16 : size === DogSize.MEDIUM ? 20 : 24} />
          </div>
          <div className="text-left">
            <p className={cn('font-bold text-sm', isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-slate-700 dark:text-slate-300')}>
              {label}
            </p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
        <span className={cn('font-bold', isSelected ? 'text-orange-600' : 'text-slate-600 dark:text-slate-400')}>
          {price.toLocaleString()} ₽
        </span>
      </motion.button>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-8">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                index <= stepIndex ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>

        {/* Step Title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {initialData ? t('booking.edit') : t('booking.new')}
          </h2>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Pet Details */}
          {currentStep === 'pet' && (
            <motion.div
              key="pet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                  {t('booking.petDetails')}
                </h3>
                
                <Autocomplete
                  value={formData.dogName}
                  onChange={val => setFormData(prev => ({ ...prev, dogName: val }))}
                  onSelectDog={handleDogSelect}
                  bookings={allBookings}
                  placeholder="e.g. Buddy"
                  label={t('booking.dogName')}
                  icon={<Dog size={20} />}
                  className="mb-4"
                />

                <div className="space-y-1 mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    {t('booking.breed')}
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={e => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="Golden Retriever"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                  {t('booking.size')}
                </h3>
                <div className="space-y-3">
                  <SizeCard size={DogSize.SMALL} label={t('booking.small')} desc={t('booking.smallDesc')} price={PRICES[DogSize.SMALL]} />
                  <SizeCard size={DogSize.MEDIUM} label={t('booking.medium')} desc={t('booking.mediumDesc')} price={PRICES[DogSize.MEDIUM]} />
                  <SizeCard size={DogSize.LARGE} label={t('booking.large')} desc={t('booking.largeDesc')} price={PRICES[DogSize.LARGE]} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Dates */}
          {currentStep === 'dates' && (
            <motion.div
              key="dates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('booking.selectDates')}
              </h3>

              <DateRangePicker
                checkIn={formData.checkIn}
                checkOut={formData.checkOut}
                onChangeCheckIn={date => setFormData(prev => ({ ...prev, checkIn: date }))}
                onChangeCheckOut={date => setFormData(prev => ({ ...prev, checkOut: date }))}
                bookings={allBookings}
                maxCapacity={maxCapacity}
                excludeBookingId={initialData?.id}
              />

              {!availability.available && formData.checkIn && formData.checkOut && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm"
                >
                  {t('validation.noCapacity')}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('booking.confirmation')}
              </h3>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {formData.dogName[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      {formData.dogName}
                    </h4>
                    <p className="text-slate-500">{formData.breed}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">{t('booking.checkIn')}</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{formData.checkIn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">{t('booking.checkOut')}</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{formData.checkOut}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('booking.days')}</span>
                    <span>{totalDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('booking.pricePerDay')}</span>
                    <span>{formData.pricePerDay.toLocaleString()} ₽</span>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{t('booking.totalPrice')}</span>
                  <span className="text-2xl font-bold text-orange-600">{totalPrice.toLocaleString()} ₽</span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  {t('booking.comment')}
                </label>
                <textarea
                  value={formData.comment}
                  onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="..."
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={currentStep === 'confirm' ? handleSubmit : handleNext}
          disabled={!canGoNext || isLoading || (currentStep === 'confirm' && !availability.available)}
          className={cn(
            'w-full mt-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2',
            canGoNext && availability.available
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : currentStep === 'confirm' ? (
            <>
              <Check size={20} />
              {initialData ? t('common.save') : t('booking.new')}
            </>
          ) : (
            <>
              {t('common.next')}
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </BottomSheet>
  );
};

export default BookingForm;
