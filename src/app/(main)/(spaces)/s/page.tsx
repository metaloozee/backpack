import { db } from '@/lib/db';
import { spaces as spacesSchema } from '@/lib/db/schema/app';
import { eq } from 'drizzle-orm';
import { Cards } from '@/components/spaces/Cards';
import { Header } from '@/components/spaces/Header';
import { getUser } from '@/lib/auth/utils';

export default async function SpacesPage() {
    const user = await getUser();

    const spaces = await db
        .select()
        .from(spacesSchema)
        .where(eq(spacesSchema.userId, user?.id ?? ''));

    return (
        <div className="m-20 flex flex-col justify-center items-start gap-5">
            <Header userId={user?.id ?? ''} />
            <Cards spaces={spaces} />
        </div>
    );
}
