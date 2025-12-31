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
                hotelName: String(response.data.hotelName || 'DogStay Hotel'),
                maxCapacity: Number(response.data.maxCapacity) || 10,
                logoUrl: String(response.data.logoUrl || ''),
                tgToken: String(response.data.tgToken || ''),
                tgChatId: String(response.data.tgChatId || ''),
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
  const str = String(dateStr);
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
     const [y, m, d] = str.split('-');
     return `${d}.${m}.${y}`;
  }
  try {
    return new Date(str).toLocaleDateString('ru-RU');
  } catch (e) {
    return str;
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
  const legacyTotal = (Number(booking.diaperCost) || 0) + (Number(booking.damageCost) || 0);

  return (days * Number(booking.pricePerDay)) + expensesTotal + legacyTotal;
};

// --- Normalize booking data from backend ---
const normalizeBooking = (b: any): Booking => {
  return {
    id: String(b.id || ''),
    dogName: String(b.dogName || ''),
    breed: String(b.breed || ''),
    size: b.size || DogSize.MEDIUM,
    checkIn: String(b.checkIn || ''),
    checkOut: String(b.checkOut || ''),
    pricePerDay: Number(b.pricePerDay) || 0,
    totalCost: Number(b.totalCost) || 0,
    status: b.status || BookingStatus.REQUEST,
    comment: String(b.comment || ''),
    createdAt: Number(b.createdAt) || Date.now(),
    expenses: Array.isArray(b.expenses) ? b.expenses.map((e: any) => ({
      title: String(e.title || ''),
      amount: Number(e.amount) || 0
    })) : [],
    diaperCost: Number(b.diaperCost) || 0,
    damageCost: Number(b.damageCost) || 0,
    tags: Array.isArray(b.tags) ? b.tags.map((t: any) => String(t)) : [],
    checklist: Array.isArray(b.checklist) ? b.checklist.map((c: any) => String(c)) : [],
    vaccineExpires: String(b.vaccineExpires || ''),
    photoUrl: String(b.photoUrl || ''),
    ownerName: b.ownerName ? String(b.ownerName) : undefined,
    ownerPhone: b.ownerPhone ? String(b.ownerPhone) : undefined,
  };
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

    return data.map(normalizeBooking);
  } catch (e) {
    console.error("Failed to fetch bookings", e);
    return [];
  }
};

export const saveBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>, id?: string): Promise<void> => {
  const payload: any = { ...booking };
  
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
