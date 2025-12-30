import { Booking, AppSettings } from './types';

const STORAGE_KEY = 'dogstay_api_url';

export const getApiUrl = () => localStorage.getItem(STORAGE_KEY) || '';
export const setApiUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

// Helper to handle Google Apps Script quirks (CORS/Redirects)
const fetchGas = async (payload: any) => {
  const url = getApiUrl();
  if (!url) throw new Error("API URL not configured");

  const response = await fetch(url, {
    method: 'POST', // Always use POST for GAS to avoid caching and handle complex data
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
};

export const api = {
  getBookings: async (): Promise<Booking[]> => {
    // We send a POST with action 'read' to standardise communication
    const res = await fetchGas({ action: 'read', type: 'bookings' });
    return Array.isArray(res) ? res : (res.data || []);
  },

  saveBooking: async (booking: Partial<Booking>): Promise<void> => {
    await fetchGas({ 
      action: booking.id ? 'update' : 'create', 
      data: booking 
    });
  },

  deleteBooking: async (id: string): Promise<void> => {
    await fetchGas({ action: 'delete', id });
  },

  getSettings: async (): Promise<AppSettings> => {
    const res = await fetchGas({ action: 'read', type: 'settings' });
    return res.data || { hotelName: 'My Dog Hotel', maxCapacity: 10 };
  }
};
