
import React, { useState, useRef } from 'react';
import { setApiUrl, fetchRemoteSettings, saveRemoteSettings } from '../services/mockBackend';
import { Dog, ArrowRight, Check, Link as LinkIcon, Box, Rocket, AlertTriangle, Image as ImageIcon, Upload } from 'lucide-react';

interface Props {
  onComplete: (settings: any) => void;
}

const OnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  
  // Step 2 & 3 Data
  const [hotelName, setHotelName] = useState('My Dog Hotel');
  const [capacity, setCapacity] = useState(10);
  const [logoUrl, setLogoUrl] = useState('');
  const [fetchedExisting, setFetchedExisting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!url.includes('script.google.com')) {
      setError('Это не похоже на ссылку Google Script.');
      return;
    }

    if (!url.includes('/exec') && !url.includes('/dev')) {
        setError('Ссылка должна заканчиваться на /exec (или /dev). Вы скопировали ссылку из редактора?');
        return;
    }

    setIsChecking(true);
    setError('');
    
    setApiUrl(url);
    
    // Try to fetch existing settings
    const existing = await fetchRemoteSettings();
    
    setIsChecking(false);
    
    if (existing) {
        // Found settings!
        if (existing.hotelName !== 'DogStay Hotel' || existing.tgToken || existing.logoUrl) {
            setFetchedExisting(true);
            setTimeout(() => onComplete(existing), 1500);
        } else {
            setStep(2);
        }
    } else {
        setError('Не удалось подключиться.');
        setApiUrl(''); 
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40000) {
        alert('Файл слишком большой! Максимум 40КБ для сохранения в Таблице. Пожалуйста, используйте ссылку или сожмите изображение.');
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
     
     const newSettings = {
         hotelName,
         maxCapacity: capacity,
         logoUrl: logoUrl,
         theme: 'light' as const
     };

     const success = await saveRemoteSettings(newSettings);
     
     setIsChecking(false);
     
     if (success) {
         // Trust local state immediately to avoid race conditions with GET cache
         onComplete(newSettings);
     } else {
         setError('Ошибка сохранения. Проверьте интернет.');
     }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Header Image / Icon */}
        <div className="h-40 bg-gray-100 dark:bg-black/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="bg-white p-4 rounded-full shadow-xl z-10 overflow-hidden relative w-24 h-24 flex items-center justify-center border-4 border-white">
               {logoUrl ? (
                   <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                   <Dog size={40} className="text-teal-600" />
               )}
            </div>
        </div>

        <div className="p-8 flex-1 flex flex-col">
            
            {/* Step 1: Connect */}
            {step === 1 && !fetchedExisting && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Добро пожаловать!</h2>
                        <p className="text-gray-500 mt-2">Давайте подключим вашу Google Таблицу.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Google Web App URL</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://script.google.com/.../exec"
                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                            />
                        </div>
                        
                        {error ? (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1 mb-1">
                                    <AlertTriangle size={12}/> Ошибка подключения:
                                </p>
                                <p className="text-red-500 text-xs">{error}</p>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 mt-2">Вставьте ссылку из Apps Script (Deploy -&gt; Web App).</p>
                        )}
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={handleUrlSubmit}
                            disabled={isChecking || !url}
                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isChecking ? 'Подключение...' : 'Подключить'} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1.5: Found Existing */}
            {fetchedExisting && (
                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <Check size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold">База найдена!</h3>
                    <p className="text-gray-500">Загружаем настройки вашей гостиницы...</p>
                </div>
            )}

            {/* Step 2: Setup New */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                     <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Брендинг</h2>
                        <p className="text-gray-500 mt-2">Настройте внешний вид.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Название отеля</label>
                            <input 
                                type="text" 
                                value={hotelName}
                                onChange={e => setHotelName(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Вместимость</label>
                            <input 
                                type="number" 
                                value={capacity}
                                onChange={e => setCapacity(Number(e.target.value))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Логотип</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                        placeholder="Ссылка на картинку..."
                                        className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                                    />
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title="Загрузить файл"
                                >
                                    <Upload size={20} className="text-gray-600 dark:text-gray-300" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Или загрузите файл (макс 40КБ).</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleSetupSubmit}
                        disabled={isChecking}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                         {isChecking ? 'Сохранение...' : 'Запустить!'} <Rocket size={18} />
                    </button>
                </div>
            )}

        </div>

        {/* Progress Dots */}
        {!fetchedExisting && (
            <div className="bg-gray-50 dark:bg-black/20 p-4 flex justify-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
            </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
