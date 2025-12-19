
export enum DogSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE'
}

export enum BookingStatus {
  WAITLIST = 'WAITLIST',
  REQUEST = 'REQUEST',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ExpenseItem {
  title: string;
  amount: number;
}

export interface Booking {
  id: string;
  dogName: string;
  breed: string;
  size: DogSize;
  checkIn: string; // ISO Date String YYYY-MM-DD
  checkOut: string; // ISO Date String YYYY-MM-DD
  pricePerDay: number;
  
  // Legacy fields (kept for backward compatibility)
  diaperCost?: number;
  damageCost?: number;

  // New flexible expenses
  expenses?: ExpenseItem[];

  comment?: string;
  tags?: string[];
  checklist?: string[];
  vaccineExpires?: string;
  photoUrl?: string;
  status: BookingStatus;
  createdAt: number;
}

export interface Stats {
  currentDogs: number;
  revenueMonth: number;
  bookingsNextMonth: number;
}

export interface GapMatch {
  booking: Booking;
  revenue: number;
  gapType: 'PERFECT' | 'FIT';
}

// Pricing Constants
export const PRICES = {
  [DogSize.SMALL]: 1500,
  [DogSize.MEDIUM]: 2000,
  [DogSize.LARGE]: 3000,
};

export const AVAILABLE_TAGS = [
  { label: 'Агрессия', color: 'bg-red-500', text: 'text-red-100' },
  { label: 'Лекарства', color: 'bg-blue-500', text: 'text-blue-100' },
  { label: 'Щенок', color: 'bg-green-500', text: 'text-green-100' },
  { label: 'Свой корм', color: 'bg-yellow-500', text: 'text-yellow-100' },
  { label: 'Течка', color: 'bg-pink-500', text: 'text-pink-100' },
  { label: 'Аллергик', color: 'bg-purple-500', text: 'text-purple-100' },
];

export const CHECKLIST_ITEMS = ['Свой корм', 'Лекарства', 'Ошейник/Поводок', 'Любимая игрушка', 'Лежанка', 'Ветпаспорт'];
