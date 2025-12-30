import { Booking, BookingStatus, AppSettings } from '../types';
import { calculateDays } from '../utils/helpers';

const API_URL_KEY = 'dogstay_api_url';

export const getApiUrl = () => localStorage.getItem(API_URL_KEY) || '';
export const setApiUrl = (url: string) => localStorage.setItem(API_URL_KEY, url);

const postToGas = async (payload: Record<string, unknown>) => {
  const url = getApiUrl();
  if (!url) throw new Error('API URL not set');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Invalid JSON from backend:', text);
    throw new Error('Invalid response from server');
  }
};

export const api = {
  async getBookings(): Promise<Booking[]> {
    try {
      const response = await postToGas({ action: 'getBookings' });
      const data = response.data || [];
      
      if (!Array.isArray(data)) {
        console.warn('getBookings received non-array', data);
        return [];
      }

      return data.map((b: Record<string, unknown>) => ({
        ...b,
        pricePerDay: Number(b.pricePerDay) || 0,
        diaperCost: Number(b.diaperCost) || 0,
        damageCost: Number(b.damageCost) || 0,
        createdAt: Number(b.createdAt) || Date.now(),
        expenses: Array.isArray(b.expenses) ? b.expenses : [],
        tags: Array.isArray(b.tags) ? b.tags : [],
        checklist: Array.isArray(b.checklist) ? b.checklist : []
      })) as Booking[];
    } catch (e) {
      console.error('Failed to fetch bookings', e);
      return [];
    }
  },

  async getSettings(): Promise<AppSettings | null> {
    try {
      const response = await postToGas({ action: 'getSettings' });
      
      if (response?.data) {
        return {
          hotelName: response.data.hotelName || 'DogStay Hotel',
          maxCapacity: Number(response.data.maxCapacity) || 10,
          logoUrl: response.data.logoUrl || '',
          tgToken: response.data.tgToken || '',
          tgChatId: response.data.tgChatId || '',
          theme: response.data.theme || 'light',
          locale: response.data.locale || 'ru',
          isLegacy: false
        };
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch settings', e);
      return null;
    }
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      const res = await postToGas({
        action: 'saveSettings',
        data: settings
      });
      return res.status === 'success';
    } catch (e) {
      console.error('Failed to save settings', e);
      return false;
    }
  },

  async saveBooking(booking: Omit<Booking, 'id' | 'createdAt'>, id?: string): Promise<Booking | null> {
    const payload: Record<string, unknown> = { ...booking };
    
    try {
      if (id) {
        payload.id = id;
        await postToGas({
          action: 'updateBooking',
          data: payload
        });
        return { ...booking, id, createdAt: Date.now() } as Booking;
      } else {
        const result = await postToGas({
          action: 'createBooking',
          data: payload
        });
        return result.data as Booking;
      }
    } catch (e) {
      console.error('Failed to save booking', e);
      return null;
    }
  },

  async deleteBooking(id: string): Promise<boolean> {
    try {
      const result = await postToGas({
        action: 'deleteBooking',
        id
      });
      return result.status === 'success';
    } catch (e) {
      console.error('Failed to delete booking', e);
      return false;
    }
  }
};

export const calculateTotal = (booking: Booking): number => {
  const days = calculateDays(booking.checkIn, booking.checkOut);
  const expensesTotal = booking.expenses 
    ? booking.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) 
    : 0;
  const legacyTotal = (booking.diaperCost || 0) + (booking.damageCost || 0);

  return (days * booking.pricePerDay) + expensesTotal + legacyTotal;
};

export const getOccupancyForDate = (
  date: Date, 
  bookings: Booking[]
): number => {
  const dateStr = date.toISOString().split('T')[0];
  return bookings.filter(b => {
    if (b.status === BookingStatus.CANCELLED) return false;
    return dateStr >= b.checkIn && dateStr <= b.checkOut;
  }).length;
};

export const checkAvailability = (
  checkIn: string,
  checkOut: string,
  bookings: Booking[],
  maxCapacity: number,
  excludeId?: string
): { available: boolean; minRemaining: number } => {
  let minRemaining = maxCapacity;
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const occupancy = bookings.filter(b => {
      if (b.id === excludeId) return false;
      if (b.status === BookingStatus.CANCELLED) return false;
      const dateStr = d.toISOString().split('T')[0];
      return dateStr >= b.checkIn && dateStr <= b.checkOut;
    }).length;

    const remaining = maxCapacity - occupancy;
    if (remaining < minRemaining) minRemaining = remaining;
  }

  return {
    available: minRemaining > 0,
    minRemaining
  };
};
