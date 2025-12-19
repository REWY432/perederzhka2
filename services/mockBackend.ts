
import { Booking, BookingStatus, DogSize } from "../types";

const STORAGE_KEY = 'dogstay_api_url';
const CAPACITY_KEY = 'dogstay_max_capacity';

export const getApiUrl = () => localStorage.getItem(STORAGE_KEY) || '';
export const setApiUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

export const getMaxCapacity = (): number => {
    const val = localStorage.getItem(CAPACITY_KEY);
    return val ? parseInt(val, 10) : 10; // Default to 10 places
};

export const setMaxCapacity = (num: number) => localStorage.setItem(CAPACITY_KEY, num.toString());

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
  
  // Sum up new expenses list
  const expensesTotal = booking.expenses 
    ? booking.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) 
    : 0;

  // Include legacy fields if they exist
  const legacyTotal = (booking.diaperCost || 0) + (booking.damageCost || 0);

  return (days * booking.pricePerDay) + expensesTotal + legacyTotal;
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
    // Ensure numbers are numbers and arrays are arrays
    return data.map((b: any) => ({
        ...b,
        pricePerDay: Number(b.pricePerDay),
        diaperCost: Number(b.diaperCost),
        damageCost: Number(b.damageCost),
        createdAt: Number(b.createdAt),
        // Google sheets might return "null" string or empty string for JSON columns
        expenses: Array.isArray(b.expenses) ? b.expenses : []
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
