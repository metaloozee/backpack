import { db } from '@/lib/db/index';

import { auth } from '@/auth';

export async function createTRPCContext(opts: { headers: Headers }) {
    const session = await auth();

    return {
        db,
        session: session,
        ...opts,
    };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
