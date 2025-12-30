import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dog, ArrowRight, Check, Link as LinkIcon, Rocket, AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setApiUrl, api } from '../services/api';
import { AppSettings } from '../types';
import { cn, triggerHaptic } from '../utils/helpers';

interface OnboardingProps {
  onComplete: (settings: AppSettings) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  // Step 2 Data
  const [hotelName, setHotelName] = useState('My Dog Hotel');
  const [capacity, setCapacity] = useState(10);
  const [logoUrl, setLogoUrl] = useState('');
  const [fetchedExisting, setFetchedExisting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!url.includes('script.google.com')) {
      setError(t('onboarding.invalidUrl'));
      return;
    }

    if (!url.includes('/exec') && !url.includes('/dev')) {
      setError(t('onboarding.invalidUrlEnding'));
      return;
    }

    setIsChecking(true);
    setError('');
    setApiUrl(url);

    try {
      const existing = await api.getSettings();
      setIsChecking(false);

      if (existing) {
        triggerHaptic('medium');
        // Found settings - check if it's a new setup or existing
        if (existing.hotelName !== 'DogStay Hotel' || existing.logoUrl) {
          setFetchedExisting(true);
          setTimeout(() => onComplete(existing), 1500);
        } else {
          setStep(2);
        }
      } else {
        setError(t('onboarding.connectionFailed'));
        setApiUrl('');
      }
    } catch {
      setIsChecking(false);
      setError(t('onboarding.connectionFailed'));
      setApiUrl('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40000) {
      alert(t('onboarding.fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSetupSubmit = async () => {
    setIsChecking(true);
    triggerHaptic('medium');

    const newSettings: AppSettings = {
      hotelName,
      maxCapacity: capacity,
      logoUrl,
      theme: 'light',
      locale: 'ru'
    };

    const success = await api.saveSettings(newSettings);
    setIsChecking(false);

    if (success) {
      onComplete(newSettings);
    } else {
      setError(t('onboarding.connectionFailed'));
    }
  };

  const inputClass = cn(
    'w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl py-3.5 px-4',
    'text-slate-900 dark:text-white font-medium placeholder:text-slate-400',
    'outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 transition-all'
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col min-h-[500px]"
      >
        {/* Header Image */}
        <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-20 h-20 border-2 border-slate-400 rounded-full" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-slate-400 rounded-lg rotate-45" />
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xl z-10 overflow-hidden relative w-24 h-24 flex items-center justify-center border-4 border-white dark:border-slate-700"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Dog size={40} className="text-orange-500" />
            )}
          </motion.div>
        </div>

        <div className="p-8 flex-1 flex flex-col">
          {/* Step 1: Connect */}
          <AnimatePresence mode="wait">
            {step === 1 && !fetchedExisting && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {t('onboarding.welcome')}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {t('onboarding.connectSheet')}
                  </p>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('onboarding.enterUrl')}
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder={t('onboarding.urlPlaceholder')}
                      className={cn(inputClass, 'pl-11')}
                    />
                  </div>

                  {error ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg"
                    >
                      <p className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1 mb-1">
                        <AlertTriangle size={12} /> {t('common.error')}
                      </p>
                      <p className="text-red-500 dark:text-red-300 text-xs">{error}</p>
                    </motion.div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2">{t('onboarding.urlHint')}</p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUrlSubmit}
                  disabled={isChecking || !url}
                  className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isChecking ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                  {isChecking ? t('onboarding.connecting') : t('onboarding.connect')}
                </motion.button>
              </motion.div>
            )}

            {/* Found Existing */}
            {fetchedExisting && (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center flex-1 text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                >
                  <Check size={32} className="text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('onboarding.foundExisting')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {t('onboarding.loadingSettings')}
                </p>
              </motion.div>
            )}

            {/* Step 2: Setup */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {t('onboarding.branding')}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {t('onboarding.setupBranding')}
                  </p>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {t('settings.hotelName')}
                    </label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={e => setHotelName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {t('settings.maxCapacity')}
                    </label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={e => setCapacity(Number(e.target.value))}
                      className={inputClass}
                      min={1}
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {t('onboarding.logo')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder={t('onboarding.logoUrl')}
                        className={cn(inputClass, 'flex-1')}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={t('onboarding.uploadFile')}
                      >
                        <Upload size={20} className="text-slate-600 dark:text-slate-400" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSetupSubmit}
                  disabled={isChecking}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                >
                  {isChecking ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Rocket size={18} />
                  )}
                  {t('onboarding.launch')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Dots */}
        {!fetchedExisting && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 flex justify-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full transition-colors',
              step === 1 ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
            )} />
            <div className={cn(
              'w-2 h-2 rounded-full transition-colors',
              step === 2 ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
            )} />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;
