import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/utils';

export async function middleware(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}

export const config = {
    runtime: 'nodejs',
    matcher: ['/((?!api|_next/static|_next/image|sign-in|.*\\.png$).*)'],
};
