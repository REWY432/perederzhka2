import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, DogSize, PRICES, AVAILABLE_TAGS } from '../types';
import { checkRangeAvailability } from '../services/tetrisService';
import { X, ArrowLeft, Calendar, Dog, Info, Check } from 'lucide-react';

interface Props {
  initialData?: Booking;
  allBookings: Booking[];
  maxCapacity: number;
  onClose: () => void;
  onSave: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
}

const BookingForm: React.FC<Props> = ({ initialData, allBookings, maxCapacity, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'createdAt'>>({
    dogName: '',
    breed: '',
    size: DogSize.SMALL,
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date().toISOString().split('T')[0],
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

  const [totalEstimate, setTotalEstimate] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
          ...initialData,
          checkIn: initialData.checkIn || new Date().toISOString().split('T')[0],
          checkOut: initialData.checkOut || new Date().toISOString().split('T')[0],
      });
    }
  }, []);

  const calculateDays = (start: string, end: string) => {
      const s = new Date(start);
      const e = new Date(end);
      const diff = e.getTime() - s.getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      return days > 0 ? days : 0;
  };

  useEffect(() => {
    const days = calculateDays(formData.checkIn, formData.checkOut);
    const total = days * formData.pricePerDay;
    setTotalEstimate(total);
  }, [formData.checkIn, formData.checkOut, formData.pricePerDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, totalCost: totalEstimate });
  };

  // Redesigned Input Components
  const InputField = ({ icon: Icon, label, ...props }: any) => (
      <div className="space-y-1">
          {label && <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>}
          <div className="relative group">
              {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />}
              <input 
                  {...props}
                  className={`w-full bg-slate-100 rounded-2xl py-4 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 transition-all`}
              />
          </div>
      </div>
  );

  const SizeCard = ({ size, label, price, icon }: { size: DogSize, label: string, price: number, icon: any }) => {
      const isSelected = formData.size === size;
      return (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, size, pricePerDay: price }))}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all w-full ${
                isSelected 
                ? 'border-orange-500 bg-orange-50 text-orange-900' 
                : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
              <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-orange-200 text-orange-700' : 'bg-white text-slate-400'}`}>
                      {icon}
                  </div>
                  <div className="text-left">
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-xs opacity-70">Up to {size === DogSize.SMALL ? '10kg' : size === DogSize.MEDIUM ? '25kg' : 'unlimited'}</p>
                  </div>
              </div>
              <span className="font-bold">{price.toLocaleString()} ₽</span>
          </button>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:rounded-3xl md:overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between">
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-50 rounded-full">
                <ArrowLeft size={24} className="text-slate-900" />
            </button>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
                {initialData ? 'Edit Booking' : 'New Booking'}
            </h2>
            <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 custom-scrollbar">
            
            {/* Dog Details */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider opacity-50">Pet Details</h3>
                <InputField 
                    icon={Dog}
                    placeholder="e.g. Buddy"
                    label="Dog Nickname"
                    value={formData.dogName}
                    onChange={(e: any) => setFormData({...formData, dogName: e.target.value})}
                />
                <InputField 
                    placeholder="Golden Retriever"
                    label="Breed"
                    value={formData.breed}
                    onChange={(e: any) => setFormData({...formData, breed: e.target.value})}
                />
            </div>

            {/* Size Selection */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider opacity-50">Breed Size</h3>
                <div className="space-y-3">
                    <SizeCard size={DogSize.SMALL} label="Small Breed" price={PRICES[DogSize.SMALL]} icon={<Dog size={18}/>} />
                    <SizeCard size={DogSize.MEDIUM} label="Medium Breed" price={PRICES[DogSize.MEDIUM]} icon={<Dog size={22}/>} />
                    <SizeCard size={DogSize.LARGE} label="Large Breed" price={PRICES[DogSize.LARGE]} icon={<Dog size={26}/>} />
                </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider opacity-50">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                    <InputField 
                        icon={Calendar}
                        type="date"
                        label="Check-in"
                        value={formData.checkIn}
                        onChange={(e: any) => setFormData({...formData, checkIn: e.target.value})}
                    />
                    <InputField 
                        icon={Calendar}
                        type="date"
                        label="Check-out"
                        value={formData.checkOut}
                        onChange={(e: any) => setFormData({...formData, checkOut: e.target.value})}
                    />
                </div>
            </div>

            {/* Totals */}
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-4">
                 <div className="flex justify-between items-center text-orange-900/60">
                     <span>Days</span>
                     <span>{calculateDays(formData.checkIn, formData.checkOut)}</span>
                 </div>
                 <div className="flex justify-between items-center text-orange-900/60">
                     <span>Price per day</span>
                     <span>{formData.pricePerDay} ₽</span>
                 </div>
                 <div className="h-px bg-orange-200 my-2"></div>
                 <div className="flex justify-between items-center text-xl font-bold text-orange-900">
                     <span>Total Price</span>
                     <span>{totalEstimate.toLocaleString()} ₽</span>
                 </div>
            </div>

             {/* Status Selection (Hidden for new bookings usually, but kept for edit) */}
             <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-900 uppercase tracking-wider opacity-50">Status</label>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                     {[BookingStatus.REQUEST, BookingStatus.CONFIRMED].map(s => (
                         <button
                            key={s}
                            type="button"
                            onClick={() => setFormData(p => ({...p, status: s}))}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                formData.status === s ? 'bg-white shadow text-slate-900' : 'text-slate-400'
                            }`}
                         >
                             {s}
                         </button>
                     ))}
                 </div>
             </div>

        </div>

        {/* Footer Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100">
            <button 
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
                {initialData ? 'Save Changes' : 'Create Booking'}
            </button>
        </div>
    </div>
  );
};

export default BookingForm;