import { getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db/index';
import { users } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function PUT(request: Request) {
    const { session } = await getUserAuth();
    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    await db.update(users).set(body).where(eq(users.id, session.user.id));

    revalidatePath('/account');

    return new Response(
        JSON.stringify({
            message: 'Account updated successfully',
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}
