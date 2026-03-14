export const logsQueryKeys = {
  all: ['logs'] as const,
  dashboard: () => [...logsQueryKeys.all, 'dashboard'] as const,
  timeline: (range: 'week' | 'month') => [...logsQueryKeys.all, 'timeline', range] as const,
  calendar: () => [...logsQueryKeys.all, 'calendar'] as const,
  todayEntries: () => [...logsQueryKeys.all, 'today-entries'] as const,
};
