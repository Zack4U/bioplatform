"use client";

/**
 * React Query provider for the application.
 * Wraps TanStack Query v5 QueryClientProvider with sensible defaults.
 */

import { handleApiError } from "@/lib/error-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        onError: (error) => {
                            handleApiError(error);
                        },
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
