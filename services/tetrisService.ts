
import { Booking, BookingStatus, GapMatch } from "../types";
import { calculateTotal } from "./mockBackend";

/**
 * Main Logic for "Smart Tetris"
 * 
 * 1. Calculate occupancy map for next 60 days.
 * 2. Find waitlisted bookings that fit into gaps where Occupancy < MaxCapacity.
 */
export const findGapMatches = (bookings: Booking[], maxCapacity: number): GapMatch[] => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // 1. Build Occupancy Map
    // Map<"YYYY-MM-DD", count>
    const occupancyMap = new Map<string, number>();
    
    // Only count Confirmed or Completed (active) bookings
    const activeBookings = bookings.filter(b => 
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
    );

    activeBookings.forEach(b => {
        const start = new Date(b.checkIn);
        const end = new Date(b.checkOut);
        
        // Loop through each day of the booking
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const current = occupancyMap.get(dateKey) || 0;
            occupancyMap.set(dateKey, current + 1);
        }
    });

    // 2. Check Waitlist
    const waitlist = bookings.filter(b => b.status === BookingStatus.WAITLIST);
    const matches: GapMatch[] = [];

    waitlist.forEach(wb => {
        const start = new Date(wb.checkIn);
        const end = new Date(wb.checkOut);
        
        // Don't suggest bookings in the past
        if (end < today) return;

        let fits = true;
        
        // Check every day of the waitlisted booking
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const currentOccupancy = occupancyMap.get(dateKey) || 0;
            
            // If even one day is over capacity, it doesn't fit
            if (currentOccupancy >= maxCapacity) {
                fits = false;
                break;
            }
        }

        if (fits) {
            matches.push({
                booking: wb,
                revenue: calculateTotal(wb),
                gapType: 'PERFECT' // In future could add 'PARTIAL' logic
            });
        }
    });

    return matches;
};

/**
 * Check availability for a specific date range
 * Returns: { available: boolean, remainingSpots: number }
 */
export const checkRangeAvailability = (
    bookings: Booking[], 
    checkIn: string, 
    checkOut: string, 
    maxCapacity: number,
    ignoreBookingId?: string // If we are editing an existing booking, don't count itself
): { available: boolean, minRemaining: number } => {
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    let minRemaining = maxCapacity;

    const activeBookings = bookings.filter(b => 
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED) &&
        b.id !== ignoreBookingId
    );

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        
        // Count occupancy for this day
        const occupancy = activeBookings.filter(b => {
             return dateKey >= b.checkIn && dateKey <= b.checkOut;
        }).length;

        const remaining = maxCapacity - occupancy;
        if (remaining < minRemaining) minRemaining = remaining;
    }

    return {
        available: minRemaining > 0,
        minRemaining: minRemaining
    };
};
