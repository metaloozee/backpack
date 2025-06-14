import { db } from '@/lib/db/index';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { DefaultSession, getServerSession, NextAuthOptions } from 'next-auth';
import { Adapter } from 'next-auth/adapters';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env.mjs';
import GithubProvider from 'next-auth/providers/github';

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            id: string;
        };
    }
}

export type AuthSession = {
    session: {
        user: {
            id: string;
            name?: string;
            email?: string;
        };
    } | null;
};

export const authOptions: NextAuthOptions = {
    adapter: DrizzleAdapter(db) as Adapter,
    callbacks: {
        session: ({ session, user }) => {
            session.user.id = user.id;
            return session;
        },
    },
    providers: [
        GithubProvider({
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        }),
    ],
};

export const getUserAuth = async () => {
    const session = await getServerSession(authOptions);
    return { session };
};

export const checkAuth = async () => {
    const { session } = await getUserAuth();
    if (!session) redirect('/sign-in');
};
