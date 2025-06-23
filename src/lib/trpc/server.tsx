import 'server-only';

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { headers } from 'next/headers';
import { createTRPCContext } from './context';
import { appRouter } from '@/lib/server/routers/_app';
import { makeQueryClient } from './query-client';

export const getQueryClient = cache(makeQueryClient);

const createServerContext = cache(async () => {
    const headersList = await headers();
    const headersObject = new Headers();

    headersList.forEach((value: string, key: string) => {
        headersObject.set(key, value);
    });

    return createTRPCContext({ headers: headersObject });
});

export const trpc = createTRPCOptionsProxy({
    ctx: createServerContext,
    router: appRouter,
    queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(createServerContext);
