import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { spaces as spacesSchema } from '@/lib/db/schema/app';
import { eq } from 'drizzle-orm';
import { LibraryIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'timeago.js';
import { Cards } from '@/components/spaces/Cards';
import { Header } from '@/components/spaces/Header';

export default async function SpacesPage() {
    await checkAuth();
    const { session } = await getUserAuth();
    const user = session!.user!;

    // const spaces = await db
    //     .select()
    //     .from(spacesSchema)
    //     .where(eq(spacesSchema.userId, user.id))

    const spaces = [
        {
            id: '1',
            userId: 'sdsd',
            spaceName: 'Python',
            createdAt: new Date(),
        },
        {
            id: '2',
            userId: 'sdsd',
            spaceName: 'JavaScript',
            createdAt: new Date(),
        },
        {
            id: '3',
            userId: 'sdsd',
            spaceName: 'Computer Networks',
            createdAt: new Date(),
        },
        {
            id: '4',
            userId: 'sdsd',
            spaceName: 'Operating Systems',
            createdAt: new Date(),
        },
    ];

    return (
        <div className="mt-20 flex flex-col justify-center items-start gap-5">
            <Header userId={user.id} />
            <Cards spaces={spaces} />
        </div>
    );
}
