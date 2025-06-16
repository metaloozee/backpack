import 'server-only';

import { getUserAuth } from '@/lib/auth/utils';
import { appRouter } from '@/lib/server/routers/_app';
import { env } from '@/lib/env.mjs';
import { createTRPCContext } from './context';

import { createTRPCClient, loggerLink, TRPCClientError } from '@trpc/client';
import { type TRPCErrorResponse } from '@trpc/server/rpc';
import { observable } from '@trpc/server/observable';

import { cache } from 'react';
import { cookies } from 'next/headers';

const createContext = cache(async () => {
    const cookieString = await (await cookies()).toString();
    return createTRPCContext({
        headers: new Headers({
            cookie: cookieString,
            'x-trpc-source': 'rsc',
        }),
    });
});

export const api = createTRPCClient<typeof appRouter>({
    links: [
        loggerLink({
            enabled: (op) =>
                env.NODE_ENV === 'development' ||
                (op.direction === 'down' && op.result instanceof Error),
        }),
        /**
         * Custom RSC link that directly executes the procedure on the server without
         * an HTTP round-trip. We rely on `createCallerFactory` which returns a fully-typed
         * proxy caller for the router.
         */
        () =>
            ({ op }) =>
                observable((observer) => {
                    createContext()
                        .then((ctx) => {
                            const caller = appRouter.createCaller(ctx);
                            // Traverse the proxy by path (dot-separated)
                            const target = op.path
                                .split('.')
                                .reduce<any>((acc, segment) => acc[segment], caller);
                            return target(op.input);
                        })
                        .then((data) => {
                            observer.next({ result: { data } });
                            observer.complete();
                        })
                        .catch((cause: TRPCErrorResponse) => {
                            observer.error(TRPCClientError.from(cause));
                        });
                }),
    ],
});
