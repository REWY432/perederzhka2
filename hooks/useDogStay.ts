import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiUrl } from '../services/api';
import { Booking, AppSettings, BookingStatus } from '../types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const KEYS = {
  BOOKINGS: ['bookings'],
  SETTINGS: ['settings'],
};

export const useBookings = () => {
  return useQuery({
    queryKey: KEYS.BOOKINGS,
    queryFn: async () => {
      const url = getApiUrl();
      if (!url) return [];
      return await api.getBookings();
    },
    enabled: !!getApiUrl(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: KEYS.SETTINGS,
    queryFn: async () => {
      const url = getApiUrl();
      if (!url) return null;
      return await api.getSettings();
    },
    enabled: !!getApiUrl(),
  });
};

export const useSaveBooking = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<Booking, 'id' | 'createdAt'>; id?: string }) => {
      return await api.saveBooking(data, id);
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.BOOKINGS });
      toast.success(
        variables.id ? t('booking.updated') : t('booking.created'),
        {
          description: result?.dogName,
        }
      );
    },
    onError: () => {
      toast.error(t('toast.error'), {
        description: t('toast.networkError')
      });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      return await api.deleteBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.BOOKINGS });
      toast.success(t('booking.deleted'));
    },
    onError: () => {
      toast.error(t('toast.error'));
    },
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ id, status, booking }: { id: string; status: BookingStatus; booking: Booking }) => {
      const { id: _, createdAt, ...rest } = booking;
      return await api.saveBooking({ ...rest, status }, id);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: KEYS.BOOKINGS });
      const previousBookings = queryClient.getQueryData<Booking[]>(KEYS.BOOKINGS);
      
      queryClient.setQueryData<Booking[]>(KEYS.BOOKINGS, old => 
        old?.map(b => b.id === id ? { ...b, status } : b) || []
      );
      
      return { previousBookings };
    },
    onError: (_, __, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(KEYS.BOOKINGS, context.previousBookings);
      }
      toast.error(t('toast.error'));
    },
    onSuccess: () => {
      toast.success(t('toast.statusUpdated'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.BOOKINGS });
    }
  });
};

export const useSaveSettings = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (settings: Partial<AppSettings>) => {
      const success = await api.saveSettings(settings);
      if (!success) throw new Error('Failed');
      return settings;
    },
    onSuccess: (newSettings) => {
      queryClient.invalidateQueries({ queryKey: KEYS.SETTINGS });
      queryClient.setQueryData(KEYS.SETTINGS, (old: AppSettings) => ({
        ...old,
        ...newSettings
      }));
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('toast.error'));
    }
  });
};

export const useLongPress = (
  onLongPress: () => void,
  ms: number = 500
) => {
  const timerRef = { current: null as NodeJS.Timeout | null };
  
  const start = () => {
    timerRef.current = setTimeout(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      onLongPress();
    }, ms);
  };

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear
  };
};
