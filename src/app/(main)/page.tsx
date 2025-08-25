import { Chat } from '@/components/chat';
import { models } from '@/lib/ai/models';
import { getDefaultToolsState } from '@/lib/ai/tools';

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth/utils';

export default async function IndexPage() {
    const session = await getSession();

    const id = randomUUID();
    const cookieStore = await cookies();
    const selectedModel = cookieStore.get('X-Model-Id')?.value ?? models[0].id;

    const toolsStateString = cookieStore.get('X-Tools-State')?.value;
    let initialTools = getDefaultToolsState();
    if (toolsStateString) {
        try {
            initialTools = JSON.parse(toolsStateString);
        } catch (error) {
            console.error('Failed to parse tools state from cookie:', error);
            initialTools = getDefaultToolsState();
        }
    }
    const initialMode = cookieStore.get('X-Mode-Selection')?.value ?? 'ask';
    const initialAgent = cookieStore.get('X-Selected-Agent')?.value;

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <Chat
                env={{ inSpace: false }}
                id={id}
                initialMessages={[]}
                session={session}
                autoResume={true}
                initialModel={selectedModel}
                initialTools={initialTools}
                initialMode={initialMode}
                initialAgent={initialAgent}
            />
        </div>
    );
}
