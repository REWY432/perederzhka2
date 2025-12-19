import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, DogSize, PRICES, AVAILABLE_TAGS, CHECKLIST_ITEMS } from '../types';
import { calculateDays } from '../services/mockBackend';
import { X, AlertTriangle, Check, Syringe, ChevronLeft } from 'lucide-react';

interface Props {
  initialData?: Booking;
  allBookings: Booking[]; // Passed for history lookup
  onClose: () => void;
  onSave: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
}

const BookingForm: React.FC<Props> = ({ initialData, allBookings, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'createdAt'>>({
    dogName: '',
    breed: '',
    size: DogSize.SMALL,
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date().toISOString().split('T')[0],
    pricePerDay: PRICES[DogSize.SMALL],
    diaperCost: 0,
    damageCost: 0,
    comment: '',
    tags: [],
    checklist: [],
    vaccineExpires: '',
    photoUrl: '',
    status: BookingStatus.REQUEST
  });

  const [days, setDays] = useState(1);
  const [totalEstimate, setTotalEstimate] = useState(0);

  // History State
  const [historyMatch, setHistoryMatch] = useState<{lastVisit: string, damage: number} | null>(null);

  // Vaccine Warning
  const isVaccineExpired = formData.vaccineExpires && new Date(formData.vaccineExpires) < new Date(formData.checkOut);

  // Helper to handle date timezone shifts
  const toLocalYMD = (d: string | undefined) => {
    if (!d) return '';
    // If YYYY-MM-DD already
    if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
    
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        
        // Offset to Local Time for ISO string
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    } catch {
        return d.split('T')[0] || '';
    }
  };

  // Initialize form data on mount
  useEffect(() => {
    if (initialData) {
      setFormData({
          ...initialData,
          checkIn: toLocalYMD(initialData.checkIn),
          checkOut: toLocalYMD(initialData.checkOut),
          vaccineExpires: toLocalYMD(initialData.vaccineExpires)
      });
    }
  }, []); // Empty dependency array ensures this only runs once on mount

  // Smart History Lookup
  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, dogName: name }));
    
    // Prevent auto-fill/overwrite if we are editing and the name matches the original record
    if (initialData && name.trim().toLowerCase() === initialData.dogName.trim().toLowerCase()) {
        return;
    }

    if (name.length > 2) {
        // Find most recent booking for this dog
        const match = allBookings
            .filter(b => b.dogName.toLowerCase() === name.toLowerCase())
            .sort((a,b) => b.createdAt - a.createdAt)[0];
        
        if (match) {
            // Update fields but PRESERVE current dates
            setFormData(prev => ({
                ...prev,
                breed: match.breed,
                size: match.size,
                pricePerDay: PRICES[match.size],
                vaccineExpires: toLocalYMD(match.vaccineExpires)
            }));

            if (match.damageCost > 0) {
                setHistoryMatch({ lastVisit: match.checkOut, damage: match.damageCost });
            } else {
                setHistoryMatch(null);
            }
        } else {
            setHistoryMatch(null);
        }
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value as DogSize;
    setFormData(prev => ({
      ...prev,
      size: newSize,
      pricePerDay: PRICES[newSize]
    }));
  };

  const toggleTag = (tagLabel: string) => {
    setFormData(prev => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tagLabel)) {
        return { ...prev, tags: currentTags.filter(t => t !== tagLabel) };
      } else {
        return { ...prev, tags: [...currentTags, tagLabel] };
      }
    });
  };

  const toggleChecklist = (item: string) => {
     setFormData(prev => {
        const list = prev.checklist || [];
        if (list.includes(item)) return { ...prev, checklist: list.filter(i => i !== item)};
        return { ...prev, checklist: [...list, item] };
     });
  };

  useEffect(() => {
    const d = calculateDays(formData.checkIn, formData.checkOut);
    setDays(d > 0 ? d : 0);
    const total = (d * formData.pricePerDay) + Number(formData.diaperCost) + Number(formData.damageCost);
    setTotalEstimate(total > 0 ? total : 0);
  }, [formData.checkIn, formData.checkOut, formData.pricePerDay, formData.diaperCost, formData.damageCost]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full p-3 bg-white/50 dark:bg-black/40 border border-white/30 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none backdrop-blur-sm transition-all text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400";
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-gray-900 md:bg-white/90 md:dark:bg-gray-900/90 backdrop-blur-2xl w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl shadow-2xl md:border border-white/40 dark:border-white/10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300">
                <ChevronLeft size={24} />
             </button>
             <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-blue-700 dark:from-teal-400 dark:to-blue-400">
                {initialData ? 'Редактировать' : 'Новое заселение'}
             </h2>
          </div>
          <button onClick={onClose} className="hidden md:block p-2 bg-white/50 dark:bg-white/10 rounded-full hover:bg-white/80 dark:hover:bg-white/20 transition-colors text-gray-600 dark:text-gray-300">
            <X size={20} />
          </button>
          <button
              onClick={handleSubmit}
              className="md:hidden px-4 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-sm"
            >
              Сохранить
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 pb-24 md:pb-8">
            
            {/* Dog Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="relative">
                <label className={labelClass}>Кличка</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={formData.dogName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Рекс"
                />
                {historyMatch && (
                    <div className="absolute top-0 right-0 -mt-6 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                        <AlertTriangle size={12} />
                        Был ущерб: {historyMatch.damage}₽
                    </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Порода</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={formData.breed}
                  onChange={e => setFormData({...formData, breed: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>Размер</label>
                <select
                  className={inputClass}
                  value={formData.size}
                  onChange={handleSizeChange}
                >
                  <option value={DogSize.SMALL}>Мелкая (1500₽)</option>
                  <option value={DogSize.MEDIUM}>Средняя (2000₽)</option>
                  <option value={DogSize.LARGE}>Крупная (3000₽)</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelClass}>Метки</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => {
                  const isSelected = (formData.tags || []).includes(tag.label);
                  return (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => toggleTag(tag.label)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isSelected 
                          ? `${tag.color} text-white border-transparent shadow-md` 
                          : 'bg-white/40 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {tag.label} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Дата заезда</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={formData.checkIn}
                  onChange={e => setFormData({...formData, checkIn: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>Дата выезда</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={formData.checkOut}
                  onChange={e => setFormData({...formData, checkOut: e.target.value})}
                />
              </div>
            </div>

            {/* Financials */}
            <div className="bg-gray-50 dark:bg-black/40 p-5 rounded-2xl border border-gray-100 dark:border-white/10 space-y-4 shadow-inner">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-teal-500 rounded-full"></span>
                Стоимость
              </h3>
              <div className="grid grid-cols-3 gap-3 md:gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Цена/день</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={formData.pricePerDay}
                      onChange={e => setFormData({...formData, pricePerDay: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Памперсы</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={formData.diaperCost}
                      onChange={e => setFormData({...formData, diaperCost: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Ущерб</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={formData.damageCost}
                      onChange={e => setFormData({...formData, damageCost: Number(e.target.value)})}
                    />
                  </div>
              </div>

              {/* Cost Breakdown */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-2 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Проживание ({days} дн.):</span>
                      <span className="font-medium">{(days * formData.pricePerDay).toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-teal-800 dark:text-teal-400 font-bold text-lg border-t border-dashed border-gray-300 dark:border-gray-700 mt-2">
                    <span>Итого:</span>
                    <span>{totalEstimate.toLocaleString()} ₽</span>
                  </div>
              </div>
            </div>

            {/* Vaccine & Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Checklist */}
                <div>
                  <label className={labelClass}>С собой</label>
                  <div className="grid grid-cols-2 gap-2">
                      {CHECKLIST_ITEMS.map(item => {
                          const checked = (formData.checklist || []).includes(item);
                          return (
                              <div 
                                  key={item} 
                                  onClick={() => toggleChecklist(item)}
                                  className={`cursor-pointer p-2 rounded-lg border flex items-center gap-2 transition-all text-xs font-bold ${
                                      checked 
                                          ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-300' 
                                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                                  }`}
                              >
                                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                                      checked ? 'bg-teal-500 border-teal-500' : 'border-gray-400'
                                  }`}>
                                      {checked && <Check size={8} className="text-white" />}
                                  </div>
                                  <span className="truncate">{item}</span>
                              </div>
                          )
                      })}
                  </div>
                </div>

                {/* Vaccine */}
                <div>
                  <label className={labelClass}>Срок прививки</label>
                  <div className="relative">
                      <input
                          type="date"
                          className={`${inputClass} ${isVaccineExpired ? 'border-red-500 text-red-600 bg-red-50' : ''}`}
                          value={formData.vaccineExpires || ''}
                          onChange={e => setFormData({...formData, vaccineExpires: e.target.value})}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <Syringe size={16} />
                      </div>
                  </div>
                  {isVaccineExpired && (
                      <div className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={12} /> Просрочено к моменту выезда!
                      </div>
                  )}
                </div>
            </div>

            {/* Extra Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Статус</label>
                  <select
                    className={inputClass}
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}
                  >
                    <option value={BookingStatus.REQUEST}>Заявка</option>
                    <option value={BookingStatus.CONFIRMED}>Подтверждено</option>
                    <option value={BookingStatus.COMPLETED}>Завершено</option>
                    <option value={BookingStatus.CANCELLED}>Отмена</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Комментарий</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={formData.comment}
                    onChange={e => setFormData({...formData, comment: e.target.value})}
                    placeholder="Особенности собаки, питание..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-end gap-3 pt-6 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 rounded-xl hover:bg-white/80 dark:hover:bg-white/20 transition-all font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl hover:shadow-lg hover:from-teal-700 hover:to-teal-600 font-bold transition-all transform active:scale-95"
              >
                Сохранить
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;