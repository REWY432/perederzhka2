import { Booking, BookingStatus, DogSize } from "../types";

const STORAGE_KEY = 'dogstay_api_url';

export const getApiUrl = () => localStorage.getItem(STORAGE_KEY) || '';
export const setApiUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  // Handle YYYY-MM-DD specifically to avoid timezone shifts and ensure RU format
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
  return (days * booking.pricePerDay) + (booking.diaperCost || 0) + (booking.damageCost || 0);
};

// --- Async API Methods ---

export const getBookings = async (): Promise<Booking[]> => {
  const url = getApiUrl();
  if (!url) {
    console.warn("API URL not set");
    return [];
  }
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    // Ensure numbers are numbers (Google Sheets might return strings)
    return data.map((b: any) => ({
        ...b,
        pricePerDay: Number(b.pricePerDay),
        diaperCost: Number(b.diaperCost),
        damageCost: Number(b.damageCost),
        createdAt: Number(b.createdAt)
    }));
  } catch (e) {
    console.error("Failed to fetch bookings", e);
    return [];
  }
};

export const saveBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>, id?: string): Promise<void> => {
  const url = getApiUrl();
  if (!url) return;

  const payload: any = { ...booking };
  
  if (!id) {
    payload.id = Math.random().toString(36).substr(2, 9);
    payload.createdAt = Date.now();
  } else {
    payload.id = id;
  }

  // Use text/plain to avoid CORS preflight issues with GAS (Simple Request)
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: id ? 'update' : 'create',
      data: payload
    })
  });
};

export const deleteBooking = async (id: string): Promise<void> => {
  const url = getApiUrl();
  if (!url) return;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'delete',
      data: { id }
    })
  });
};