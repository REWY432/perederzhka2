import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hotel, Bell, Globe, LogOut, MessageSquare, Loader2, Check, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppSettings } from '../types';
import { changeLanguage } from '../i18n';
import { cn, triggerHaptic } from '../utils/helpers';
import { ConfirmDialog, SettingsSkeleton } from '../components/ui';
import { toast } from 'sonner';

interface SettingsPageProps {
  settings: AppSettings | null;
  onSave: (settings: Partial<AppSettings>) => void;
  onDisconnect: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSave,
  onDisconnect,
  isLoading = false,
  isSaving = false
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Partial<AppSettings>>({
    hotelName: settings?.hotelName || '',
    maxCapacity: settings?.maxCapacity || 10,
    tgToken: settings?.tgToken || '',
    tgChatId: settings?.tgChatId || '',
    theme: settings?.theme || 'light',
    locale: settings?.locale || 'ru'
  });
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData({
        hotelName: settings.hotelName || '',
        maxCapacity: settings.maxCapacity || 10,
        tgToken: settings.tgToken || '',
        tgChatId: settings.tgChatId || '',
        theme: settings.theme || 'light',
        locale: settings.locale || 'ru'
      });
    }
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = (lng: 'ru' | 'en') => {
    changeLanguage(lng);
    setFormData(prev => ({ ...prev, locale: lng }));
    triggerHaptic('light');
  };

  const testTelegram = async () => {
    if (!formData.tgToken || !formData.tgChatId) {
      toast.error(t('settings.testFailed'));
      return;
    }
    
    setIsTestingTg(true);
    
    try {
      const url = `https://api.telegram.org/bot${formData.tgToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: formData.tgChatId,
          text: '🔔 <b>Test Notification</b>\n\nDogStay system connected!',
          parse_mode: 'HTML'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast.success(t('settings.testSent'));
        triggerHaptic('medium');
      } else {
        toast.error(t('settings.testFailed'));
      }
    } catch {
      toast.error(t('settings.testFailed'));
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
    triggerHaptic('medium');
  };

  if (isLoading) {
    return (
      <div className="p-6 pb-24">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          {t('settings.title')}
        </h2>
        <SettingsSkeleton />
      </div>
    );
  }

  const inputClass = cn(
    'w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl py-3.5 px-4',
    'text-slate-900 dark:text-white font-medium placeholder:text-slate-400',
    'outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all'
  );

  const sectionClass = cn(
    'bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm',
    'border border-slate-100 dark:border-slate-800 space-y-4'
  );

  return (
    <div className="p-6 space-y-6 pb-32">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-slate-900 dark:text-white"
      >
        {t('settings.title')}
      </motion.h2>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={sectionClass}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
            <Hotel size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('settings.general')}
          </h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
            {t('settings.hotelName')}
          </label>
          <input
            type="text"
            className={inputClass}
            value={formData.hotelName}
            onChange={e => handleChange('hotelName', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
            {t('settings.maxCapacity')}
          </label>
          <input
            type="number"
            className={inputClass}
            value={formData.maxCapacity}
            onChange={e => handleChange('maxCapacity', Number(e.target.value))}
            min={1}
            max={100}
          />
        </div>
      </motion.div>

      {/* Language Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={sectionClass}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Globe size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('settings.language')}
          </h3>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleLanguageChange('ru')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              i18n.language === 'ru'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            🇷🇺 Русский
            {i18n.language === 'ru' && <Check size={16} />}
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              i18n.language === 'en'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            🇬🇧 English
            {i18n.language === 'en' && <Check size={16} />}
          </button>
        </div>
      </motion.div>

      {/* Telegram Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={sectionClass}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
            <Bell size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('settings.notifications')}
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
            {t('settings.botToken')}
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="123456:ABC..."
            value={formData.tgToken}
            onChange={e => handleChange('tgToken', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
            {t('settings.chatId')}
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="-100..."
            value={formData.tgChatId}
            onChange={e => handleChange('tgChatId', e.target.value)}
          />
        </div>

        <button
          onClick={testTelegram}
          disabled={isTestingTg || !formData.tgToken || !formData.tgChatId}
          className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-2 disabled:opacity-50"
        >
          {isTestingTg ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MessageSquare size={16} />
          )}
          {t('settings.testConnection')}
        </button>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(sectionClass, 'border-red-100 dark:border-red-900/30')}
      >
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
          {t('settings.dangerZone')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t('settings.disconnectWarning')}
        </p>
        <button
          onClick={() => setShowDisconnectConfirm(true)}
          className="w-full py-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={18} />
          {t('settings.disconnect')}
        </button>
      </motion.div>

      {/* Save Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSaving && <Loader2 size={20} className="animate-spin" />}
        {t('common.save')}
      </motion.button>

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={onDisconnect}
        title={t('settings.disconnect')}
        description={t('settings.disconnectWarning')}
        confirmText={t('settings.disconnect')}
        danger
      />
    </div>
  );
};

export default SettingsPage;
