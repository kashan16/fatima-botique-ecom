// components/Providers.tsx
'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // create the QueryClient on the client only (stable across renders)
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount: number, error) => {
            if (error?.message?.includes('404')) return false;
            return failureCount < 3;
          },
          staleTime: 30 * 1000,
        },
      },
    })
  );

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ClerkProvider>
  );
}
