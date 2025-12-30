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
  expenses?: ExpenseItem[];
  diaperCost?: number;
  damageCost?: number;
  tags?: string[];
  checklist?: string[];
  vaccineExpires?: string;
  photoUrl?: string;
  ownerPhone?: string;
  ownerName?: string;
}

export interface AppSettings {
  hotelName: string;
  maxCapacity: number;
  logoUrl?: string;
  tgToken?: string;
  tgChatId?: string;
  theme?: 'light' | 'dark';
  locale?: 'ru' | 'en';
  isLegacy?: boolean;
}

export const PRICES: Record<DogSize, number> = {
  [DogSize.SMALL]: 1500,
  [DogSize.MEDIUM]: 2000,
  [DogSize.LARGE]: 3000
};

export const AVAILABLE_TAGS = [
  { label: 'aggression', color: 'bg-red-500' },
  { label: 'allergy', color: 'bg-orange-500' },
  { label: 'medication', color: 'bg-blue-500' },
  { label: 'puppy', color: 'bg-green-500' },
  { label: 'heat', color: 'bg-pink-500' },
  { label: 'vip', color: 'bg-purple-500' }
];

export const CHECKLIST_ITEMS = [
  'vetPassport',
  'food',
  'collar',
  'favoriteToy',
  'bed'
];

export interface GapMatch {
  booking: Booking;
  revenue: number;
  gapType: 'PERFECT' | 'PARTIAL';
}

export interface DogProfile {
  name: string;
  breed: string;
  size: DogSize;
  tags: string[];
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
}
