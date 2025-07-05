import { db } from '@/lib/db/index';

import { api } from '@/lib/auth/server';
import { headers } from 'next/headers';

export async function createTRPCContext() {
    const session = await api.getSession({
        headers: await headers(),
    });

    return {
        db,
        session: session,
    };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
