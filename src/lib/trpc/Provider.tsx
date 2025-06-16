'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    loggerLink,
    httpBatchStreamLink,
    httpLink,
    isNonJsonSerializable,
    splitLink,
} from '@trpc/client';
import React, { useState } from 'react';

import { trpc } from './client';
import { getUrl } from './utils';

import SuperJSON from 'superjson';

export default function TrpcProvider({
    children,
    cookies,
}: {
    children: React.ReactNode;
    cookies: string;
}) {
    const [queryClient] = useState(() => new QueryClient({}));
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                loggerLink({
                    enabled: (op) =>
                        process.env.NODE_ENV === 'development' ||
                        (op.direction === 'down' && op.result instanceof Error),
                }),
                splitLink({
                    condition: (op) =>
                        op.input instanceof FormData || isNonJsonSerializable(op.input),
                    true: httpLink({
                        url: getUrl(),
                        transformer: {
                            serialize: (data) => data as any,
                            deserialize: SuperJSON.deserialize as any,
                        },
                        headers() {
                            return {
                                cookie: cookies,
                                'x-trpc-source': 'react',
                            };
                        },
                    }),
                    false: httpBatchStreamLink({
                        url: getUrl(),
                        transformer: SuperJSON,
                        headers() {
                            return {
                                cookie: cookies,
                                'x-trpc-source': 'react',
                            };
                        },
                    }),
                }),
            ],
        })
    );
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}
