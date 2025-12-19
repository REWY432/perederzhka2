import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar as CalendarIcon, ClipboardList, BarChart3, Dog, Plus, Settings, Link as LinkIcon, AlertTriangle, Send, Sun, Moon, Columns, Menu } from 'lucide-react';
import { Booking, BookingStatus } from './types';
import { getBookings, saveBooking, deleteBooking, getApiUrl, setApiUrl } from './services/mockBackend';
import { getTelegramSettings, saveTelegramSettings, sendTelegramMessage } from './services/telegramService';

// Pages
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import BookingsList from './pages/BookingsList';
import Reports from './pages/Reports';
import KanbanBoard from './pages/KanbanBoard';
import BookingForm from './components/BookingForm';

// Components
const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-white/20 dark:bg-white/10 text-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-sm border border-white/20 dark:border-white/5' 
          : 'text-white/80 dark:text-gray-400 hover:bg-white/10 hover:text-white dark:hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium tracking-wide">{label}</span>
    </Link>
  );
};

const MobileNavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
        isActive 
          ? 'text-teal-500 scale-110' 
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [tempUrl, setTempUrl] = useState(getApiUrl());
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // Telegram Settings
  const [tgSettings, setTgSettings] = useState(getTelegramSettings());
  const [tempTgToken, setTempTgToken] = useState(getTelegramSettings().token);
  const [tempTgChatId, setTempTgChatId] = useState(getTelegramSettings().chatId);

  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    if (!apiUrl) return;
    setIsLoading(true);
    const data = await getBookings();
    setBookings(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [apiUrl]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleSaveSettings = () => {
    setApiUrl(tempUrl);
    setApiUrlState(tempUrl);
    
    saveTelegramSettings(tempTgToken, tempTgChatId);
    setTgSettings({ token: tempTgToken, chatId: tempTgChatId });
    
    setIsSettingsOpen(false);
  };

  const handleSaveBooking = async (data: Omit<Booking, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    let payload = data;
    if (editingBooking) {
        payload = { ...data, createdAt: editingBooking.createdAt } as any;
    }
    
    await saveBooking(payload, editingBooking?.id);
    
    // Telegram Notification for new bookings
    if (!editingBooking && tgSettings.token) {
        const msg = `🐶 <b>Новый заезд!</b>\n\nГость: ${data.dogName} (${data.breed})\nДаты: ${data.checkIn} - ${data.checkOut}\nСумма в день: ${data.pricePerDay}р`;
        await sendTelegramMessage(msg);
    }

    setIsFormOpen(false);
    setEditingBooking(undefined);
    await refreshData();
  };

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        setIsLoading(true);
        const { id: _id, ...rest } = booking;
        await saveBooking({ ...rest, status: newStatus }, id);
        await refreshData();
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту запись? Это действие необратимо.')) {
      setIsLoading(true);
      await deleteBooking(id);
      await refreshData();
    }
  };

  return (
    <Router>
      <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black/60' : ''}`}>
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden md:flex w-64 flex-col z-20 m-4 rounded-3xl bg-black/20 dark:bg-black/80 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl text-white">
          <div className="p-8 border-b border-white/10 dark:border-white/5 flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-300 to-orange-500 p-2 rounded-xl shadow-lg">
              <Dog className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DogStay</h1>
              <p className="text-xs text-white/60 dark:text-gray-400">Менеджер</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-3">
            <SidebarLink to="/" icon={LayoutDashboard} label="Дашборд" />
            <SidebarLink to="/board" icon={Columns} label="Доска" />
            <SidebarLink to="/calendar" icon={CalendarIcon} label="Календарь" />
            <SidebarLink to="/bookings" icon={ClipboardList} label="Бронирования" />
            <SidebarLink to="/reports" icon={BarChart3} label="Отчеты" />
          </nav>

          <div className="p-6 border-t border-white/10 dark:border-white/5 space-y-4">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-3 px-4 py-2 text-white/60 hover:text-white transition-colors w-full"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-medium">{isDarkMode ? 'Светлая тема' : 'Темная тема'}</span>
             </button>

             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-3 px-4 py-2 text-white/60 hover:text-white transition-colors w-full"
             >
                <Settings size={20} />
                <span className="font-medium">Настройки</span>
             </button>

             <button 
                onClick={() => { setEditingBooking(undefined); setIsFormOpen(true); }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 border border-white/20"
             >
                <Plus size={20} /> 
                <span>Новый заезд</span>
             </button>
          </div>
        </aside>

        {/* Mobile Top Bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 z-30 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-300 to-orange-500 p-1.5 rounded-lg shadow-lg">
                 <Dog className="text-white" size={18} />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">DogStay</h1>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-white/80">
                 {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-white/80">
                 <Settings size={20} />
               </button>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative w-full pt-20 pb-24 md:pt-0 md:pb-0">
          
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {!apiUrl && (
            <div className="absolute top-20 md:top-8 left-4 md:left-8 right-4 md:right-8 z-40">
              <div className="bg-amber-500/90 backdrop-blur-md text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between border border-amber-400/50 gap-4 md:gap-0">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="shrink-0" />
                  <div>
                    <h3 className="font-bold">Нет подключения к Google</h3>
                    <p className="text-sm text-white/90">Укажите URL веб-приложения в настройках.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold transition-colors w-full md:w-auto"
                >
                  Настроить
                </button>
              </div>
            </div>
          )}

          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
            <Routes>
              <Route path="/" element={<Dashboard bookings={bookings} />} />
              <Route path="/board" element={<KanbanBoard bookings={bookings} onStatusChange={handleStatusChange} />} />
              <Route path="/calendar" element={<CalendarView bookings={bookings} />} />
              <Route path="/bookings" element={<BookingsList bookings={bookings} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />} />
              <Route path="/reports" element={<Reports bookings={bookings} />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-40 px-6 pb-4 flex justify-between items-center">
             <MobileNavLink to="/" icon={LayoutDashboard} label="Обзор" />
             <MobileNavLink to="/calendar" icon={CalendarIcon} label="Календарь" />
             
             {/* FAB Center Button */}
             <button 
                onClick={() => { setEditingBooking(undefined); setIsFormOpen(true); }}
                className="relative -top-5 bg-gradient-to-r from-teal-500 to-emerald-500 p-4 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.5)] border-4 border-black text-white hover:scale-105 transition-transform"
             >
                <Plus size={28} />
             </button>

             <MobileNavLink to="/bookings" icon={ClipboardList} label="Список" />
             <MobileNavLink to="/board" icon={Columns} label="Доска" />
        </div>

        {isFormOpen && (
          <BookingForm 
            initialData={editingBooking}
            allBookings={bookings}
            onClose={() => { setIsFormOpen(false); setEditingBooking(undefined); }}
            onSave={handleSaveBooking}
          />
        )}

        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
             <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl md:rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 w-full max-w-md p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                   <Settings className="text-teal-600 dark:text-teal-400" />
                   Настройки
                </h2>
                
                <div className="space-y-6">
                  {/* Google Section */}
                  <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-white/60 dark:border-white/10">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase flex items-center gap-2">
                        <LinkIcon size={16} /> Google Sheets
                     </h3>
                     <div className="mb-2">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Web App URL (Exec)</label>
                        <input 
                           type="text" 
                           value={tempUrl}
                           onChange={(e) => setTempUrl(e.target.value)}
                           placeholder="https://script.google.com/..."
                           className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-gray-700 dark:text-gray-200 text-sm"
                        />
                     </div>
                  </div>

                  {/* Telegram Section */}
                  <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-white/60 dark:border-white/10">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase flex items-center gap-2">
                        <Send size={16} /> Telegram Bot
                     </h3>
                     <div className="mb-3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bot Token</label>
                        <input 
                           type="text" 
                           value={tempTgToken}
                           onChange={(e) => setTempTgToken(e.target.value)}
                           placeholder="123456:ABC-DEF..."
                           className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-gray-700 dark:text-gray-200 text-sm"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chat ID</label>
                        <input 
                           type="text" 
                           value={tempTgChatId}
                           onChange={(e) => setTempTgChatId(e.target.value)}
                           placeholder="-100..."
                           className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-gray-700 dark:text-gray-200 text-sm"
                        />
                     </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                   <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="px-5 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                   >
                      Отмена
                   </button>
                   <button 
                      onClick={handleSaveSettings}
                      className="px-5 py-2 bg-teal-600 dark:bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
                   >
                      Сохранить
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </Router>
  );
};

export default App;