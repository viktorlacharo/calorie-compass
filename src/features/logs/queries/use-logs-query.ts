import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMealLogEntry, getCalendarMonth, getDashboardSummary, getTimelineAnalytics, listTodayMealLogEntries } from '@/features/logs/services/logs.mock-backend';
import { logsQueryKeys } from '@/features/logs/queries/logs.query-keys';
import type { MealLogEntry } from '@/types/nutrition';

export function useDashboardQuery() {
  return useQuery({
    queryKey: logsQueryKeys.dashboard(),
    queryFn: getDashboardSummary,
  });
}

export function useTimelineQuery(range: 'week' | 'month') {
  return useQuery({
    queryKey: logsQueryKeys.timeline(range),
    queryFn: () => getTimelineAnalytics(range),
  });
}

export function useCalendarQuery() {
  return useQuery({
    queryKey: logsQueryKeys.calendar(),
    queryFn: getCalendarMonth,
  });
}

export function useTodayEntriesQuery() {
  return useQuery({
    queryKey: logsQueryKeys.todayEntries(),
    queryFn: listTodayMealLogEntries,
  });
}

export function useCreateMealLogEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: Omit<MealLogEntry, 'id' | 'userId' | 'consumedAt'> & { consumedAt?: string }) =>
      createMealLogEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsQueryKeys.all });
    },
  });
}
