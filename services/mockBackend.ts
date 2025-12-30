import { Booking, BookingStatus, DogSize, AppSettings } from "../types";

const API_URL_KEY = 'dogstay_api_url';

// --- Local Storage (Only for the Gateway URL) ---

export const getApiUrl = () => localStorage.getItem(API_URL_KEY) || '';
export const setApiUrl = (url: string) => localStorage.setItem(API_URL_KEY, url);

// Helper for GAS POST requests
const postToGas = async (payload: any) => {
    const url = getApiUrl();
    if (!url) throw new Error("API URL not set");

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Invalid JSON from backend:", text);
        throw new Error("Invalid response from server");
    }
};

// --- Remote Settings Sync ---

export const fetchRemoteSettings = async (): Promise<AppSettings | null> => {
    try {
        const response = await postToGas({ action: 'getSettings' });
        
        if (response && response.data) {
             return {
                hotelName: response.data.hotelName || 'DogStay Hotel',
                maxCapacity: Number(response.data.maxCapacity) || 10,
                logoUrl: response.data.logoUrl || '',
                tgToken: response.data.tgToken || '',
                tgChatId: response.data.tgChatId || '',
                theme: response.data.theme || 'light',
                isLegacy: false
            };
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch settings", e);
        return null;
    }
};

export const saveRemoteSettings = async (settings: Partial<AppSettings>): Promise<boolean> => {
    try {
        const res = await postToGas({
            action: 'saveSettings',
            data: settings
        });
        return res.status === 'success';
    } catch (e) {
        console.error("Failed to save settings", e);
        return false;
    }
};

// --- Helpers ---

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
     const [y, m, d] = dateStr.split('-');
     return `${d}.${m}.${y}`;
  }
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch (e) {
    return dateStr;
  }
};

export const calculateDays = (start: string, end: string): number => {
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const calculateTotal = (booking: Booking): number => {
  const days = calculateDays(booking.checkIn, booking.checkOut);
  const expensesTotal = booking.expenses 
    ? booking.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) 
    : 0;
  const legacyTotal = (booking.diaperCost || 0) + (booking.damageCost || 0);

  return (days * booking.pricePerDay) + expensesTotal + legacyTotal;
};

// --- Async API Methods (Bookings) ---

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const response = await postToGas({ action: 'getBookings' });
    const data = response.data || [];
    
    if (!Array.isArray(data)) {
        console.warn("getBookings received non-array", data);
        return [];
    }

    return data.map((b: any) => ({
        ...b,
        pricePerDay: Number(b.pricePerDay),
        diaperCost: Number(b.diaperCost),
        damageCost: Number(b.damageCost),
        createdAt: Number(b.createdAt),
        expenses: Array.isArray(b.expenses) ? b.expenses : []
    }));
  } catch (e) {
    console.error("Failed to fetch bookings", e);
    return [];
  }
};

export const saveBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>, id?: string): Promise<void> => {
  const payload: any = { ...booking };
  
  // New bookings ID generation is handled by backend if not provided, 
  // but frontend usually provides 'id' for updates.
  // We send the ID separately for updates to match backend 'updateBooking' logic or 'createBooking' logic
  
  if (id) {
    payload.id = id;
    await postToGas({
        action: 'updateBooking',
        data: payload
    });
  } else {
    await postToGas({
        action: 'createBooking',
        data: payload
    });
  }
};

export const deleteBooking = async (id: string): Promise<void> => {
  await postToGas({
    action: 'deleteBooking',
    id: id
  });
};