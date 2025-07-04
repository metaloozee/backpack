import { headers } from 'next/headers';
import { auth } from '.';
import { Session, User } from 'better-auth';

export const getSession = async (): Promise<Session | null> => {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    return session?.session ?? null;
};

export const getUser = async (): Promise<User | null> => {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    return session?.user as User | null;
};
