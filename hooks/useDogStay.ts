import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, fetchRemoteSettings, saveBooking, deleteBooking, saveRemoteSettings, getApiUrl } from '../services/mockBackend';
import { Booking, AppSettings, BookingStatus } from '../types';
import { toast } from 'sonner';

// Keys for caching
export const KEYS = {
  BOOKINGS: ['bookings'],
  SETTINGS: ['settings'],
};

// --- Hooks ---

export const useBookings = () => {
  return useQuery({
    queryKey: KEYS.BOOKINGS,
    queryFn: async () => {
      const url = getApiUrl();
      if (!url) return [];
      return await getBookings();
    },
    enabled: !!getApiUrl(), // Only fetch if URL is set
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: KEYS.SETTINGS,
    queryFn: async () => {
      const url = getApiUrl();
      if (!url) return null;
      return await fetchRemoteSettings();
    },
    enabled: !!getApiUrl(),
  });
};

// --- Mutations ---

export const useSaveBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<Booking, 'id' | 'createdAt'>; id?: string }) => {
      await saveBooking(data, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.BOOKINGS });
      toast.success('Бронирование сохранено');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Ошибка при сохранении. Проверьте интернет.');
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.BOOKINGS });
      toast.success('Бронирование удалено');
    },
    onError: () => {
      toast.error('Ошибка удаления');
    },
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, booking }: { id: string, status: BookingStatus, booking: Booking }) => {
        // Optimistic update requires full object in backend logic usually, so we send the update
        const { id: _id, ...rest } = booking;
        await saveBooking({ ...rest, status }, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.BOOKINGS });
      toast.success('Статус обновлен');
    },
    onError: () => {
        toast.error('Не удалось обновить статус');
    }
  });
}

export const useSaveSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Partial<AppSettings>) => {
            const success = await saveRemoteSettings(settings);
            if (!success) throw new Error("Failed");
            return settings;
        },
        onSuccess: (newSettings) => {
            // Invalidate to refetch fresh data
            queryClient.invalidateQueries({ queryKey: KEYS.SETTINGS });
            
            // Also update cache directly for instant feel
            queryClient.setQueryData(KEYS.SETTINGS, (old: AppSettings) => ({
                ...old,
                ...newSettings
            }));
            
            toast.success('Настройки сохранены');
        },
        onError: () => {
            toast.error('Ошибка сохранения настроек');
        }
    });
};