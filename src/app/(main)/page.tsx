import { Chat } from '@/components/Chat';
import { getUserAuth } from '@/lib/auth/utils';
import { generateUUID } from '@/lib/ai/utils';
import { redirect } from 'next/navigation';

export default async function IndexPage() {
    const { session } = await getUserAuth();
    if (!session?.user) {
        redirect('/sign-in');
    }

    const id = generateUUID();

    return <Chat id={id} initialMessages={[]} session={session} autoResume={false} />;
}
