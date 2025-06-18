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

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <Chat
                env={{ inSpace: false }}
                id={id}
                initialMessages={[]}
                session={session}
                autoResume={false}
            />
        </div>
    );
}
