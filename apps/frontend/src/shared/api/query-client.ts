import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false, // Turn off query retries to prevent endless spinner on actual errors
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default queryClient;
