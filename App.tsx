import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, BarChart2, Settings, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { getApiUrl, setApiUrl } from './services/api';
import {
  useBookings,
  useSaveBooking,
  useDeleteBooking,
  useSettings,
  useSaveSettings,
  useUpdateStatus
} from './hooks/useDogStay';
import { Booking, BookingStatus, AppSettings } from './types';
import { cn, triggerHaptic } from './utils/helpers';

// Pages
import Dashboard from './pages/Dashboard';
import BookingsList from './pages/BookingsList';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

// Components
import BookingForm from './components/BookingForm';
import Onboarding from './components/Onboarding';

type TabType = 'home' | 'bookings' | 'reports' | 'settings';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(!!getApiUrl());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // React Query hooks
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const saveMutation = useSaveBooking();
  const deleteMutation = useDeleteBooking();
  const updateStatusMutation = useUpdateStatus();
  const saveSettingsMutation = useSaveSettings();

  // Restore active tab from session
  useEffect(() => {
    const saved = sessionStorage.getItem('dogstay_tab');
    if (saved && ['home', 'bookings', 'reports', 'settings'].includes(saved)) {
      setActiveTab(saved as TabType);
    }
  }, []);

  // Save active tab to session
  useEffect(() => {
    sessionStorage.setItem('dogstay_tab', activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  const handleSaveBooking = (data: Omit<Booking, 'id' | 'createdAt'>) => {
    const id = editingBooking?.id;
    saveMutation.mutate(
      { data, id },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingBooking(undefined);
        }
      }
    );
  };

  const handleDeleteBooking = async (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => {
        setDeletingId(null);
      }
    });
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      updateStatusMutation.mutate({ id, status, booking });
    }
  };

  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    saveSettingsMutation.mutate(newSettings);
  };

  const handleDisconnect = () => {
    setApiUrl('');
    setIsConnected(false);
    setActiveTab('home');
  };

  const handleOnboardingComplete = (completedSettings: AppSettings) => {
    setIsConnected(true);
    refetchBookings();
  };

  const openNewBooking = () => {
    setEditingBooking(undefined);
    setIsFormOpen(true);
    triggerHaptic('light');
  };

  const openEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsFormOpen(true);
  };

  // Show onboarding if not connected
  if (!isConnected) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Onboarding onComplete={handleOnboardingComplete} />
      </>
    );
  }

  const isLoading = bookingsLoading || settingsLoading;

  const navItems: { key: TabType; icon: typeof Home; label: string }[] = [
    { key: 'home', icon: Home, label: t('nav.home') },
    { key: 'bookings', icon: Calendar, label: t('nav.bookings') },
    { key: 'reports', icon: BarChart2, label: t('nav.reports') },
    { key: 'settings', icon: Settings, label: t('nav.settings') }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-white pb-24 md:pb-0 font-sans">
      <Toaster position="top-center" richColors theme="light" />

      {/* Main Content */}
      <main className="max-w-md mx-auto min-h-screen bg-[#fafaf9] dark:bg-slate-950 md:max-w-5xl md:bg-white dark:md:bg-slate-900 md:shadow-xl md:min-h-0 md:my-8 md:rounded-[3rem] md:overflow-hidden md:border md:border-slate-100 dark:md:border-slate-800 relative">
        <div className="h-full overflow-y-auto md:h-[800px] scroll-smooth">
          <AnimatePresence mode="wait">
            {isLoading && activeTab !== 'settings' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-screen md:h-full text-slate-400"
              >
                <Loader2 className="animate-spin mb-4 text-orange-500" size={40} />
                <p>{t('common.loading')}</p>
              </motion.div>
            ) : (
              <>
                {activeTab === 'home' && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Dashboard
                      bookings={bookings}
                      maxCapacity={settings?.maxCapacity || 10}
                      hotelName={settings?.hotelName}
                      onNewBooking={openNewBooking}
                      isLoading={isLoading}
                    />
                  </motion.div>
                )}

                {activeTab === 'bookings' && (
                  <motion.div
                    key="bookings"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <BookingsList
                      bookings={bookings}
                      settings={settings || undefined}
                      onEdit={openEditBooking}
                      onDelete={handleDeleteBooking}
                      onStatusChange={handleStatusChange}
                      isLoading={isLoading}
                      deletingId={deletingId}
                    />
                  </motion.div>
                )}

                {activeTab === 'reports' && (
                  <motion.div
                    key="reports"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    <Reports bookings={bookings} isLoading={isLoading} />
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <SettingsPage
                      settings={settings || null}
                      onSave={handleSaveSettings}
                      onDisconnect={handleDisconnect}
                      isLoading={settingsLoading}
                      isSaving={saveSettingsMutation.isPending}
                    />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-40 md:absolute md:w-full md:rounded-b-[3rem] safe-area-bottom">
          {navItems.slice(0, 2).map(item => (
            <NavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.key}
              onClick={() => handleTabChange(item.key)}
            />
          ))}

          {/* Center FAB */}
          <div className="relative -top-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openNewBooking}
              className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center text-white"
              aria-label={t('dashboard.newBooking')}
            >
              <Plus size={28} />
            </motion.button>
          </div>

          {navItems.slice(2).map(item => (
            <NavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.key}
              onClick={() => handleTabChange(item.key)}
            />
          ))}
        </nav>
      </main>

      {/* Booking Form */}
      <BookingForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBooking(undefined);
        }}
        onSave={handleSaveBooking}
        initialData={editingBooking}
        allBookings={bookings}
        maxCapacity={settings?.maxCapacity || 10}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
};

// Nav Button Component
interface NavButtonProps {
  icon: typeof Home;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-1 transition-colors py-1',
      isActive ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
    )}
  >
    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
