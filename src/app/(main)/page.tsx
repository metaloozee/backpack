import { Chat } from '@/components/chat';
import { models } from '@/lib/ai/models';

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth/utils';

export default async function IndexPage() {
    const session = await getSession();

    const id = randomUUID();
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
