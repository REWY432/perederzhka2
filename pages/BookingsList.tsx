import React, { useState } from 'react';
import { Booking, BookingStatus, AVAILABLE_TAGS, DogSize } from '../types';
import { calculateTotal, calculateDays, formatDate } from '../services/mockBackend';
import { Edit2, Trash2, ChevronDown, Receipt, Printer, Image as ImageIcon, Search, Filter, XCircle, ScrollText, Calendar, Share, Dog, Hourglass, ArrowRight } from 'lucide-react';
import ClientCard from '../components/ClientCard';

interface Props {
  bookings: Booking[];
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}

const getStatusLabel = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.WAITLIST: return 'В листе ожидания';
    case BookingStatus.REQUEST: return 'Заявка';
    case BookingStatus.CONFIRMED: return 'Подтверждено';
    case BookingStatus.COMPLETED: return 'Завершено';
    case BookingStatus.CANCELLED: return 'Отмена';
    default: return status;
  }
};

const getSizeLabel = (size: DogSize) => {
    switch (size) {
        case DogSize.SMALL: return 'Мелкие';
        case DogSize.MEDIUM: return 'Средние';
        case DogSize.LARGE: return 'Крупные';
        default: return size;
    }
}

const BookingsList: React.FC<Props> = ({ bookings, onEdit, onDelete, onStatusChange }) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'main' | 'waitlist'>('main');

  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [contractBooking, setContractBooking] = useState<Booking | null>(null);
  
  // CRM State
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  // Split bookings by tab type first
  const mainBookings = bookings.filter(b => b.status !== BookingStatus.WAITLIST);
  const waitlistBookings = bookings.filter(b => b.status === BookingStatus.WAITLIST);

  const targetBookings = activeTab === 'main' ? mainBookings : waitlistBookings;

  const filteredBookings = targetBookings.filter(b => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = b.dogName.toLowerCase().includes(searchLower) ||
                          b.breed.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSize = sizeFilter === 'ALL' || b.size === sizeFilter;
    const matchesTag = tagFilter === 'ALL' || (b.tags && b.tags.includes(tagFilter));

    return matchesSearch && matchesStatus && matchesSize && matchesTag;
  });

  const resetFilters = () => {
      setSearchQuery('');
      setStatusFilter('ALL');
      setSizeFilter('ALL');
      setTagFilter('ALL');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = dateStr.split('-');
        const date = new Date(Number(y), Number(m)-1, Number(d));
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
    }
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
    } catch {
        return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-modal, #receipt-modal * {
            visibility: visible;
          }
           #contract-modal, #contract-modal * {
            visibility: visible;
          }
          .modal-overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 0;
            margin: 0;
            z-index: 9999;
          }
          .modal-content {
            box-shadow: none !important;
            border: none !important;
            width: 100%;
            max-width: 100%;
            transform: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md mb-4">Реестр бронирований</h2>
          
          {/* Controls Bar */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-4 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex flex-col xl:flex-row gap-4 justify-between items-center">
             
             {/* Tabs & Search Container */}
             <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
                 {/* Tabs */}
                 <div className="flex bg-black/10 dark:bg-black/40 p-1 rounded-xl w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('main')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'main' ? 'bg-white shadow-sm text-gray-800' : 'text-white/70 hover:text-white'}`}
                    >
                        Все бронирования
                    </button>
                    <button 
                        onClick={() => setActiveTab('waitlist')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'waitlist' ? 'bg-white shadow-sm text-gray-800' : 'text-white/70 hover:text-white'}`}
                    >
                        <span>Лист ожидания</span>
                        {waitlistBookings.length > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{waitlistBookings.length}</span>
                        )}
                    </button>
                 </div>

                 {/* Search */}
                 <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Поиск по кличке или породе..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <XCircle size={16} />
                        </button>
                    )}
                 </div>
             </div>

             {/* Filters Group */}
             <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                 {/* Status Filter (Only for Main Tab) */}
                 {activeTab === 'main' && (
                    <div className="relative flex-1 sm:flex-none min-w-[140px]">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none pl-4 pr-8 py-2.5 bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer shadow-sm"
                        >
                            <option value="ALL">Все статусы</option>
                            <option value={BookingStatus.REQUEST}>Заявка</option>
                            <option value={BookingStatus.CONFIRMED}>Подтверждено</option>
                            <option value={BookingStatus.COMPLETED}>Завершено</option>
                            <option value={BookingStatus.CANCELLED}>Отмена</option>
                        </select>
                    </div>
                 )}

                 {/* Reset Button */}
                 {(statusFilter !== 'ALL' || sizeFilter !== 'ALL' || tagFilter !== 'ALL' || searchQuery) && (
                     <button 
                        onClick={resetFilters}
                        className="p-2.5 bg-white/20 dark:bg-white/10 hover:bg-white/40 dark:hover:bg-white/20 text-white rounded-xl transition-all shadow-sm"
                        title="Сбросить все"
                     >
                         <XCircle size={18} />
                     </button>
                 )}
             </div>
          </div>
      </div>

      {activeTab === 'waitlist' && filteredBookings.length > 0 && (
         <div className="bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm">
             <Hourglass size={20} />
             <p className="font-medium">Клиенты в листе ожидания будут видны здесь. Если место освободится, переведите статус в "Заявка" или "Подтверждено".</p>
         </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/30 dark:bg-black/20 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-5 border-b border-white/20">Собака / Порода</th>
              <th className="p-5 border-b border-white/20">Даты</th>
              <th className="p-5 border-b border-white/20">Стоимость</th>
              <th className="p-5 border-b border-white/20">Статус</th>
              <th className="p-5 border-b border-white/20 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 text-sm">
            {filteredBookings.length > 0 ? (
                filteredBookings.sort((a,b) => b.createdAt - a.createdAt).map(booking => {
                const total = calculateTotal(booking);
                const expenseTotal = (booking.expenses?.reduce((s,i) => s + i.amount, 0) || 0) + (booking.diaperCost || 0) + (booking.damageCost || 0);

                return (
                    <tr key={booking.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-5">
                        <button 
                            onClick={() => setSelectedClientName(booking.dogName)}
                            className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                        >
                            {booking.dogName}
                            {booking.photoUrl && (
                                <span className="text-gray-400">
                                    <ImageIcon size={14} />
                                </span>
                            )}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-xs mb-1">{booking.breed} • {getSizeLabel(booking.size)}</div>
                        <div className="flex flex-wrap gap-1">
                            {booking.tags?.map(t => {
                                const style = AVAILABLE_TAGS.find(at => at.label === t);
                                return <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${style ? style.color + ' text-white' : 'bg-gray-400 text-white'}`}>{t}</span>
                            })}
                        </div>
                    </td>
                    <td className="p-5 text-gray-700 dark:text-gray-300 font-medium">
                        <div className="whitespace-nowrap">С: {formatDate(booking.checkIn)}</div>
                        <div className="whitespace-nowrap">По: {formatDate(booking.checkOut)}</div>
                    </td>
                    <td className="p-5">
                        <div className="font-bold text-gray-800 dark:text-gray-100">{total.toLocaleString()} ₽</div>
                        {expenseTotal > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg inline-block">
                            +Доп: {expenseTotal.toLocaleString()} ₽
                        </div>
                        )}
                    </td>
                    <td className="p-5">
                        <div className="relative inline-block">
                        <select
                            value={booking.status}
                            onChange={(e) => onStatusChange(booking.id, e.target.value as BookingStatus)}
                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm border cursor-pointer outline-none focus:ring-2 focus:ring-white/50 transition-all ${
                            booking.status === BookingStatus.CONFIRMED ? 'bg-teal-100/60 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-800' :
                            booking.status === BookingStatus.REQUEST ? 'bg-amber-100/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800' :
                            booking.status === BookingStatus.COMPLETED ? 'bg-gray-100/60 dark:bg-gray-700/40 text-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-600' :
                            booking.status === BookingStatus.WAITLIST ? 'bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800' :
                            'bg-red-50/60 dark:bg-red-900/40 text-red-900 dark:text-red-200 border-red-200 dark:border-red-800'
                            }`}
                        >
                            {/* In Waitlist tab, allow moving to Request/Confirmed. In Main tab, allow standard flow */}
                            {Object.values(BookingStatus).map(s => (
                                <option key={s} value={s}>{getStatusLabel(s)}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60">
                            <ChevronDown size={14} />
                        </div>
                        </div>
                    </td>
                    <td className="p-5 text-right">
                        <div className="flex justify-end gap-1.5">
                            {activeTab === 'waitlist' && (
                                <button onClick={() => onStatusChange(booking.id, BookingStatus.REQUEST)} className="text-teal-600 bg-teal-100/50 hover:bg-teal-200 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 p-2 rounded-lg transition-colors flex items-center gap-1" title="Перевести в заявки">
                                    <ArrowRight size={16} />
                                </button>
                            )}
                            
                            {activeTab !== 'waitlist' && (
                                <>
                                    <button onClick={() => setReceiptBooking(booking)} className="text-emerald-600 bg-emerald-100/50 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 p-2 rounded-lg transition-colors" title="Квитанция">
                                        <Receipt size={16} />
                                    </button>
                                    <button onClick={() => setContractBooking(booking)} className="text-gray-600 bg-gray-100/50 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 p-2 rounded-lg transition-colors" title="Договор">
                                        <ScrollText size={16} />
                                    </button>
                                </>
                            )}
                            <button onClick={() => onEdit(booking)} className="text-teal-600 bg-teal-100/50 hover:bg-teal-200 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 p-2 rounded-lg transition-colors" title="Редактировать">
                            <Edit2 size={16} />
                            </button>
                            <button onClick={() => onDelete(booking.id)} className="text-red-600 bg-red-100/50 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 p-2 rounded-lg transition-colors" title="Удалить">
                            <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                    </tr>
                );
                })
            ) : (
                <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                            <Search size={32} className="opacity-50" />
                            <p className="text-lg font-medium">Ничего не найдено</p>
                            <p className="text-sm">
                                {activeTab === 'waitlist' 
                                    ? 'Лист ожидания пуст. Отличная работа!' 
                                    : 'Попробуйте изменить параметры поиска или фильтры'}
                            </p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.sort((a,b) => b.createdAt - a.createdAt).map(booking => {
            const total = calculateTotal(booking);
            return (
              <div key={booking.id} className="bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 p-5 rounded-2xl shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow">
                          {booking.dogName[0]}
                       </div>
                       <div>
                          <button onClick={() => setSelectedClientName(booking.dogName)} className="font-bold text-gray-900 dark:text-white text-lg">
                             {booking.dogName}
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{booking.breed}</p>
                       </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 
                        booking.status === BookingStatus.REQUEST ? 'bg-amber-100 text-amber-700' :
                        booking.status === BookingStatus.CANCELLED ? 'bg-red-100 text-red-700' : 
                        booking.status === BookingStatus.WAITLIST ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                      {getStatusLabel(booking.status)}
                    </span>
                 </div>

                 <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4 bg-white/40 dark:bg-white/5 p-3 rounded-xl">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-gray-400 uppercase font-bold">Заезд</span>
                       <span className="font-semibold">{formatDate(booking.checkIn)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] text-gray-400 uppercase font-bold">Выезд</span>
                       <span className="font-semibold">{formatDate(booking.checkOut)}</span>
                    </div>
                 </div>

                 <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-xl text-gray-900 dark:text-white">{total.toLocaleString()} ₽</div>
                    <div className="flex gap-1">
                        {booking.tags?.slice(0,3).map(t => (
                            <span key={t} className="w-2 h-2 rounded-full bg-teal-500"></span>
                        ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-4 gap-2">
                    {activeTab === 'waitlist' ? (
                         <button onClick={() => onStatusChange(booking.id, BookingStatus.REQUEST)} className="col-span-2 flex flex-col items-center justify-center py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 rounded-lg">
                            <ArrowRight size={16} />
                            <span className="text-[10px] font-bold mt-1">Принять заявку</span>
                         </button>
                    ) : (
                        <>
                            <button onClick={() => setReceiptBooking(booking)} className="flex flex-col items-center justify-center py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 rounded-lg">
                            <Receipt size={16} />
                            <span className="text-[10px] font-bold mt-1">Чек</span>
                            </button>
                            <button onClick={() => setContractBooking(booking)} className="flex flex-col items-center justify-center py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">
                            <ScrollText size={16} />
                            <span className="text-[10px] font-bold mt-1">Дог.</span>
                            </button>
                        </>
                    )}
                    
                    <button onClick={() => onEdit(booking)} className="flex flex-col items-center justify-center py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 rounded-lg">
                       <Edit2 size={16} />
                       <span className="text-[10px] font-bold mt-1">Изм.</span>
                    </button>
                    <button onClick={() => onDelete(booking.id)} className="flex flex-col items-center justify-center py-2 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">
                       <Trash2 size={16} />
                       <span className="text-[10px] font-bold mt-1">Удал.</span>
                    </button>
                 </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">
             <p>Ничего не найдено</p>
          </div>
        )}
      </div>

      {/* CRM Client Card Modal */}
      {selectedClientName && (
        <ClientCard 
            dogName={selectedClientName} 
            allBookings={bookings} 
            onClose={() => setSelectedClientName(null)} 
        />
      )}

      {/* Contract Modal */}
      {contractBooking && (
         <div id="contract-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto modal-overlay">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm no-print" onClick={() => setContractBooking(null)}></div>
            <div className="relative bg-white text-black p-6 md:p-10 max-w-3xl w-full shadow-2xl min-h-[80vh] modal-content rounded-xl md:rounded-none">
               <div className="flex justify-end no-print mb-4 md:hidden">
                   <button onClick={() => setContractBooking(null)} className="p-2 bg-gray-100 rounded-full"><XCircle size={24}/></button>
               </div>
               <div className="max-w-2xl mx-auto space-y-6">
                  <h1 className="text-xl md:text-2xl font-bold text-center uppercase border-b-2 border-black pb-4 mb-8">Договор передержки № {contractBooking.id.substring(0,5)}</h1>
                  
                  <p className="text-justify text-sm md:text-base">
                     г. Москва, {new Date().toLocaleDateString('ru-RU')}
                  </p>
                  
                  <p className="text-justify text-sm md:text-base">
                     Гостиница для животных <b>"DogStay"</b>, именуемая в дальнейшем «Исполнитель», и Владелец животного, именуемый в дальнейшем «Заказчик», заключили настоящий Договор о нижеследующем:
                  </p>

                  <h3 className="font-bold text-base md:text-lg mt-4">1. Предмет договора</h3>
                  <p className="text-justify text-sm md:text-base">
                     1.1. Исполнитель обязуется оказать услуги по временному содержанию (передержке) животного:<br/>
                     <b>Кличка:</b> {contractBooking.dogName}<br/>
                     <b>Порода:</b> {contractBooking.breed}<br/>
                     <b>Размер:</b> {contractBooking.size}<br/>
                     в период с <b>{formatDate(contractBooking.checkIn)}</b> по <b>{formatDate(contractBooking.checkOut)}</b>.
                  </p>

                  <h3 className="font-bold text-base md:text-lg mt-4">2. Стоимость услуг</h3>
                  <p className="text-justify text-sm md:text-base">
                     2.1. Стоимость передержки составляет <b>{contractBooking.pricePerDay} рублей</b> в сутки.<br/>
                     2.2. Общая стоимость услуг по договору: <b>{calculateTotal(contractBooking)} рублей</b>.<br/>
                     2.3. Дополнительные расходы (корм, лечение, ущерб) оплачиваются отдельно.
                  </p>

                  <h3 className="font-bold text-base md:text-lg mt-4">3. Обязательства сторон</h3>
                  <p className="text-justify text-sm md:text-base">
                     3.1. Заказчик подтверждает, что животное здорово, привито (Дата вакцинации: {contractBooking.vaccineExpires ? formatDate(contractBooking.vaccineExpires) : 'Не указана'}) и не имеет инфекционных заболеваний.<br/>
                     3.2. Исполнитель обязуется кормить, выгуливать и содержать животное в надлежащих условиях.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-8">
                     <div>
                        <p className="font-bold mb-4">Исполнитель:</p>
                        <p>DogStay Hotel</p>
                        <div className="h-12 md:h-20 border-b border-black mt-8"></div>
                        <p className="text-xs text-gray-500 text-center mt-1">(Подпись / М.П.)</p>
                     </div>
                     <div>
                        <p className="font-bold mb-4">Заказчик:</p>
                        <p>ФИО: ______________________</p>
                        <div className="h-12 md:h-20 border-b border-black mt-8"></div>
                        <p className="text-xs text-gray-500 text-center mt-1">(Подпись)</p>
                     </div>
                  </div>

                  <div className="no-print fixed bottom-8 right-8 hidden md:flex gap-4">
                      <button onClick={() => setContractBooking(null)} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-800 shadow-lg">Закрыть</button>
                      <button onClick={handlePrint} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white shadow-lg flex items-center gap-2"><Printer/> Печать</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Modern Receipt Modal */}
      {receiptBooking && (
        <div id="receipt-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto modal-overlay">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm no-print" onClick={() => setReceiptBooking(null)}></div>
          
          <div className="relative bg-white text-gray-900 shadow-2xl w-full max-w-sm flex flex-col modal-content font-sans rounded-2xl md:rounded-2xl">
            
            <div className="p-8 pb-4 flex flex-col items-center">
                 {/* Dog Icon */}
                 <div className="mb-4">
                     <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" alt="DogStay Logo" className="w-16 h-16 object-contain" />
                 </div>
                 
                 <h1 className="text-xl font-bold uppercase tracking-wider text-gray-800">ВЫЕЗДНОЙ ЛИСТ</h1>
                 <p className="text-sm text-gray-500 mt-1">
                     {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                 </p>
            </div>

            <div className="px-6">
                 <div className="border-t-2 border-dashed border-gray-200 my-2"></div>
            </div>

            <div className="px-8 py-4 text-center">
                 <h2 className="text-2xl font-bold text-gray-900">{receiptBooking.dogName}</h2>
                 <p className="text-gray-500">{receiptBooking.breed}</p>
            </div>

            <div className="px-8 py-2 space-y-2">
                 <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-800">Заезд</span>
                      <span className="text-gray-800">{formatShortDate(receiptBooking.checkIn)}</span>
                 </div>
                 <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-800">Выезд</span>
                      <span className="text-gray-800">{formatShortDate(receiptBooking.checkOut)}</span>
                 </div>
            </div>

            <div className="px-6">
                 <div className="border-t-2 border-dashed border-gray-200 my-4"></div>
            </div>

            <div className="px-8 space-y-3 text-sm">
                {/* Accommodation */}
                <div className="flex justify-between">
                    <span className="text-gray-600">Проживание ({calculateDays(receiptBooking.checkIn, receiptBooking.checkOut)} дн.)</span>
                    <span className="font-bold text-gray-900">{(calculateDays(receiptBooking.checkIn, receiptBooking.checkOut) * receiptBooking.pricePerDay).toLocaleString()} ₽</span>
                </div>

                {/* Expenses */}
                {receiptBooking.expenses && receiptBooking.expenses.map((ex, i) => (
                    <div key={i} className="flex justify-between">
                         <span className="text-gray-600">{ex.title}</span>
                         <span className="font-bold text-gray-900">{ex.amount.toLocaleString()} ₽</span>
                    </div>
                ))}

                {/* Legacy */}
                {(receiptBooking.diaperCost > 0) && (
                    <div className="flex justify-between">
                         <span className="text-gray-600">Памперсы</span>
                         <span className="font-bold text-gray-900">{receiptBooking.diaperCost.toLocaleString()} ₽</span>
                    </div>
                )}
                {(receiptBooking.damageCost > 0) && (
                    <div className="flex justify-between">
                         <span className="text-gray-600">Ущерб</span>
                         <span className="font-bold text-gray-900">{receiptBooking.damageCost.toLocaleString()} ₽</span>
                    </div>
                )}
            </div>

            <div className="px-6 mt-2">
               <div className="border-t-2 border-black my-4"></div>
            </div>

            <div className="px-8 pb-4">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-xl uppercase text-gray-900">ИТОГО</span>
                    <span className="font-black text-2xl text-blue-600">{calculateTotal(receiptBooking).toLocaleString()} ₽</span>
                </div>
            </div>

            <div className="px-8 py-8 text-center">
                <p className="text-gray-500 italic text-sm">Спасибо, что доверили нам {receiptBooking.dogName}!</p>
                <p className="text-gray-500 italic text-sm flex items-center justify-center gap-1">Ждем вас снова! <span className="text-red-500">❤</span></p>
            </div>
            
            {/* Controls */}
            <div className="no-print bg-gray-50 p-4 flex gap-3 mt-auto rounded-b-2xl">
               <button 
                 onClick={() => setReceiptBooking(null)} 
                 className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors text-sm"
               >
                 Закрыть
               </button>
               <button 
                 onClick={handlePrint} 
                 className="flex-1 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg"
               >
                 <Printer size={16} /> Печать
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;