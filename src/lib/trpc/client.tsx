'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { type AppRouter } from '@/lib/server/routers/_app';
import {
    createTRPCClient,
    loggerLink,
    httpLink,
    isNonJsonSerializable,
    splitLink,
    httpBatchLink,
} from '@trpc/client';
import { TRPCProvider } from '@/lib/trpc/trpc';
import { makeQueryClient } from './query-client';

import SuperJSON from 'superjson';
import { getUrl } from './utils';

import React, { useState } from 'react';

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new query client
        return makeQueryClient();
    }
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}

export default function TrpcProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();
    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [
                loggerLink({
                    enabled: (op) =>
                        process.env.NODE_ENV === 'development' ||
                        (op.direction === 'down' && op.result instanceof Error),
                }),
                splitLink({
                    condition: (op) => isNonJsonSerializable(op.input),
                    true: httpLink({
                        url: getUrl(),
                        transformer: {
                            serialize: (data) => data,
                            deserialize: SuperJSON.deserialize,
                        },
                    }),
                    false: httpBatchLink({
                        url: getUrl(),
                        transformer: SuperJSON,
                    }),
                }),
            ],
        })
    );
    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}
