import { db } from '@/lib/db/index';

import { api } from '@/lib/auth/server';
import { headers } from 'next/headers';

export async function createTRPCContext() {
    const res = await api.getSession({
        headers: await headers(),
    });

    // Normalize session shape for procedures: ensure `session.user` exists when authenticated
    const session = res?.session ? { ...res.session, user: res.user } : null;

    return {
        db,
        session,
    };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
