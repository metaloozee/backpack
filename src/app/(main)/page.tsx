import { generateUUID } from '@/lib/ai/utils';
import { Chat } from '@/components/chat';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function IndexPage() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/sign-in');
    }

    const id = generateUUID();

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <Chat
                env={{ inSpace: false }}
                id={id}
                initialMessages={[]}
                session={session}
                autoResume={true}
            />
        </div>
    );
}
