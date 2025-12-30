import React, { useState } from 'react';
import { AppSettings } from '../types';
import { sendTelegramMessage } from '../services/telegramService';
import { X, Save, LogOut, Bell, Hotel, MessageSquare, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: Partial<AppSettings>) => void;
  onDisconnect: () => void;
  inline?: boolean;
}

const SettingsModal: React.FC<Props> = ({ settings, onClose, onSave, onDisconnect, inline = false }) => {
  const [formData, setFormData] = useState<AppSettings>({
    hotelName: settings.hotelName || '',
    maxCapacity: settings.maxCapacity || 10,
    tgToken: settings.tgToken || '',
    tgChatId: settings.tgChatId || '',
    logoUrl: settings.logoUrl || '',
    theme: settings.theme || 'light',
  });

  const [isTestingTg, setIsTestingTg] = useState(false);

  const handleChange = (field: keyof AppSettings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testTelegram = async () => {
    if (!formData.tgToken || !formData.tgChatId) {
      toast.error('Token & Chat ID required');
      return;
    }
    setIsTestingTg(true);
    try {
      const success = await sendTelegramMessage(
        "🔔 <b>Test Notification</b>\n\nDogStay system connected!", 
        formData.tgToken, 
        formData.tgChatId
      );
      if (success) toast.success('Sent!');
      else toast.error('Failed to send.');
    } catch {
      toast.error('Connection error');
    } finally {
      setIsTestingTg(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border-0 rounded-xl py-3 px-4 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 transition-all";
  const labelClass = "text-sm font-bold text-slate-700 mb-2 block";
  const sectionClass = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4";

  const content = (
      <div className="space-y-6">
          <div className={sectionClass}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <Hotel size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">General</h3>
                </div>
                <div>
                    <label className={labelClass}>Hotel Name</label>
                    <input 
                        type="text" 
                        className={inputClass}
                        value={formData.hotelName}
                        onChange={e => handleChange('hotelName', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClass}>Max Capacity</label>
                    <input 
                        type="number" 
                        className={inputClass}
                        value={formData.maxCapacity}
                        onChange={e => handleChange('maxCapacity', Number(e.target.value))}
                    />
                </div>
          </div>

          <div className={sectionClass}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Bell size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Telegram Notifications</h3>
                </div>
                <div>
                    <label className={labelClass}>Bot Token</label>
                    <input 
                        type="text" 
                        className={inputClass}
                        placeholder="123456:ABC..."
                        value={formData.tgToken}
                        onChange={e => handleChange('tgToken', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClass}>Chat ID</label>
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
                    disabled={isTestingTg}
                    className="text-sm font-bold text-blue-600 flex items-center gap-2 mt-2"
                >
                    {isTestingTg ? <Loader2 size={16} className="animate-spin"/> : <MessageSquare size={16} />} 
                    Test Connection
                </button>
          </div>

          <div className={sectionClass}>
                <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                <button 
                    onClick={onDisconnect}
                    className="w-full py-3 border border-red-100 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100"
                >
                    <LogOut size={18} /> Disconnect Database
                </button>
          </div>
          
          {!inline && (
             <div className="flex justify-end gap-3 pt-4">
                 <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button onClick={() => { onSave(formData); onClose(); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Save Changes</button>
             </div>
          )}
          {inline && (
               <button 
                    onClick={() => { onSave(formData); toast.success('Settings saved'); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg"
               >
                   Save Settings
               </button>
          )}
      </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#fafaf9] rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
         <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-serif font-bold">Settings</h2>
             <button onClick={onClose} className="p-2 bg-white rounded-full"><X size={20}/></button>
         </div>
         {content}
      </div>
    </div>
  );
};

export default SettingsModal;