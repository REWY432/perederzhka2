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
  checkIn: string;
  checkOut: string;
  pricePerDay: number;
  totalCost: number;
  status: BookingStatus;
  comment?: string;
  createdAt: number;
  
  // Extended fields for app functionality
  expenses?: ExpenseItem[];
  diaperCost?: number; // Legacy support
  damageCost?: number; // Legacy support
  tags?: string[];
  checklist?: string[];
  vaccineExpires?: string;
  photoUrl?: string;
}

export interface AppSettings {
  hotelName: string;
  maxCapacity: number;
  
  // Extended fields for app functionality
  logoUrl?: string;
  tgToken?: string;
  tgChatId?: string;
  theme?: 'light' | 'dark';
  isLegacy?: boolean;
}

export const PRICES: Record<DogSize, number> = {
  [DogSize.SMALL]: 1500,
  [DogSize.MEDIUM]: 2000,
  [DogSize.LARGE]: 3000
};

export const AVAILABLE_TAGS = [
  { label: 'Агрессия', color: 'bg-red-500' },
  { label: 'Аллергия', color: 'bg-orange-500' },
  { label: 'Прием лекарств', color: 'bg-blue-500' },
  { label: 'Щенок', color: 'bg-green-500' },
  { label: 'Течка', color: 'bg-pink-500' },
  { label: 'VIP', color: 'bg-purple-500' }
];

export const CHECKLIST_ITEMS = [
  'Ветпаспорт',
  'Корм',
  'Ошейник/Шлейка',
  'Любимая игрушка',
  'Лежанка (опционально)'
];

export interface GapMatch {
  booking: Booking;
  revenue: number;
  gapType: 'PERFECT' | 'PARTIAL';
}
