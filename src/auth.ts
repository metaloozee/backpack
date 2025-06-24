import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';

import NextAuth from 'next-auth';
import { type DefaultSession } from 'next-auth';
import GitHub from 'next-auth/providers/github';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
        } & DefaultSession['user'];
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [GitHub({})],
    adapter: DrizzleAdapter(db),
    callbacks: {
        session({ session, user }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: user.id,
                },
            };
        },
    },
});
