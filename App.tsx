import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiUrl, setApiUrl } from './services/mockBackend';
import { useBookings, useSaveBooking, useDeleteBooking, useSettings, useSaveSettings, useUpdateStatus } from './hooks/useDogStay';
import { Booking, BookingStatus, AppSettings } from './types';
import { Toaster, toast } from 'sonner';
import { Dog, Home, Calendar, BarChart2, Settings, Plus, Loader2 } from 'lucide-react';
import BookingForm from './components/BookingForm';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';
import BookingsList from './pages/BookingsList';
import Reports from './pages/Reports';

// --- Components ---

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { refetch: fetchSettings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes('script.google.com')) {
      toast.error('Это не похоже на ссылку Google Apps Script');
      return;
    }
    setLoading(true);
    setApiUrl(url);
    try {
      const res = await fetchSettings(); // Test connection
      if (res.data) {
        toast.success('Подключено!');
        onComplete();
      } else {
         throw new Error("No settings");
      }
    } catch (err) {
      toast.error('Не удалось подключиться. Проверьте ссылку.');
      setApiUrl('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-orange-100">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <Dog size={40} className="text-orange-600" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-center mb-2 text-slate-900">DogStay Manager</h1>
        <p className="text-slate-500 text-center mb-8">Введите URL вашего веб-приложения Google Apps Script для начала работы.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="https://script.google.com/..."
            className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 placeholder:text-slate-400"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button 
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-orange-200"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Проверка...' : 'Подключить'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isConnected, setIsConnected] = useState(!!getApiUrl());
  const [activeTab, setActiveTab] = useState<'home' | 'bookings' | 'reports' | 'settings'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  
  // Use Centralized Hooks
  const { data: bookings = [], isLoading } = useBookings();
  const { data: settings } = useSettings();
  const saveMutation = useSaveBooking();
  const deleteMutation = useDeleteBooking();
  const updateStatusMutation = useUpdateStatus();
  const saveSettingsMutation = useSaveSettings();

  const handleSave = (data: Omit<Booking, 'id' | 'createdAt'>) => {
      const id = editingBooking?.id;
      saveMutation.mutate({ data: data, id: id }, {
          onSuccess: () => {
              setIsModalOpen(false);
              setEditingBooking(undefined);
          }
      });
  };

  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
      saveSettingsMutation.mutate(newSettings);
  };

  const handleDisconnect = () => {
      setApiUrl('');
      setIsConnected(false);
  };

  const handleDelete = (id: string) => {
      if(confirm('Удалить бронирование?')) {
          deleteMutation.mutate(id);
      }
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
     const booking = bookings.find(b => b.id === id);
     if(booking) {
         updateStatusMutation.mutate({ id, status, booking });
     }
  };

  if (!isConnected) {
    return (
      <>
        <Toaster position="top-center" />
        <Onboarding onComplete={() => setIsConnected(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 pb-24 md:pb-0 font-sans">
      <Toaster position="top-center" richColors theme="light" />
      
      {/* Main Content Area */}
      <main className="max-w-md mx-auto min-h-screen bg-[#fafaf9] md:max-w-5xl md:bg-white md:shadow-xl md:min-h-0 md:my-8 md:rounded-[3rem] md:overflow-hidden md:border md:border-slate-100 relative">
        <div className="h-full overflow-y-auto custom-scrollbar md:h-[800px]">
            {isLoading ? (
            <div className="flex flex-col items-center justify-center h-screen md:h-full text-slate-400">
                <Loader2 className="animate-spin mb-4 text-orange-500" size={40} />
                <p>Загрузка данных...</p>
            </div>
            ) : (
                <>
                    {activeTab === 'home' && (
                        <Dashboard 
                            bookings={bookings} 
                            maxCapacity={settings?.maxCapacity || 10}
                            hotelName={settings?.hotelName}
                            onNewBooking={() => { setEditingBooking(undefined); setIsModalOpen(true); }}
                        />
                    )}
                    {activeTab === 'bookings' && (
                        <BookingsList 
                            bookings={bookings} 
                            onEdit={(b) => { setEditingBooking(b); setIsModalOpen(true); }}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                        />
                    )}
                    {activeTab === 'reports' && (
                        <div className="p-6">
                            <Reports bookings={bookings} />
                        </div>
                    )}
                    {activeTab === 'settings' && settings && (
                        <div className="p-6">
                            <h2 className="text-3xl font-serif font-bold mb-6">Settings</h2>
                            <SettingsModal 
                                settings={settings}
                                onClose={() => setActiveTab('home')}
                                onSave={handleSaveSettings}
                                onDisconnect={handleDisconnect}
                                inline={true} // Render inline for mobile tab feel
                            />
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 md:absolute md:w-full md:rounded-b-[3rem]">
            <button 
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button 
                onClick={() => setActiveTab('bookings')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'bookings' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Calendar size={24} strokeWidth={activeTab === 'bookings' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Bookings</span>
            </button>
            
            {/* Floating FAB for Desktop/Mobile integration */}
            <div className="relative -top-8">
                <button 
                    onClick={() => { setEditingBooking(undefined); setIsModalOpen(true); }}
                    className="w-14 h-14 bg-orange-600 rounded-full shadow-lg shadow-orange-200 flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                    <Plus size={28} />
                </button>
            </div>

            <button 
                onClick={() => setActiveTab('reports')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <BarChart2 size={24} strokeWidth={activeTab === 'reports' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Reports</span>
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Settings</span>
            </button>
        </div>
      </main>

      {isModalOpen && (
        <BookingForm 
          initialData={editingBooking} 
          allBookings={bookings}
          maxCapacity={settings?.maxCapacity || 10}
          onClose={() => { setIsModalOpen(false); setEditingBooking(undefined); }} 
          onSave={handleSave}
        />
      )}
    </div>
  );
}