import { generateUUID } from '@/lib/ai/utils';
import { Chat } from '@/components/chat';
import { models } from '@/lib/ai/models';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function IndexPage() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/sign-in');
    }

    const id = generateUUID();
    const cookieStore = await cookies();
    const selectedModel = cookieStore.get('X-Model-Id')?.value ?? models[0].id;

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <Chat
                env={{ inSpace: false }}
                id={id}
                initialMessages={[]}
                session={session}
                autoResume={true}
                initialModel={selectedModel}
            />
        </div>
    );
}
