import { convertToUIMessages } from '@/lib/ai/utils';
import { db } from '@/lib/db';
import { chat as DBChat, message as DBMessage, spaces as DBSpace } from '@/lib/db/schema/app';
import { and, eq, asc } from 'drizzle-orm';
import { Chat as PreviewChat } from '@/components/chat';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { models } from '@/lib/ai/models';
import { getSession, getUser } from '@/lib/auth/utils';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    const user = await getUser();

    const { id: chatId } = await params;

    const cookieStore = await cookies();
    const selectedModel = cookieStore.get('X-Model-Id')?.value ?? models[0].id;

    const [chatData] = await db
        .select()
        .from(DBChat)
        .where(and(eq(DBChat.id, chatId), eq(DBChat.userId, user?.id ?? '')));

    if (!chatData) {
        return notFound();
    }

    const [spaceData] = chatData.spaceId
        ? await db
              .select()
              .from(DBSpace)
              .where(
                  and(eq(DBSpace.id, chatData.spaceId ?? ''), eq(DBSpace.userId, user?.id ?? ''))
              )
              .limit(1)
        : [undefined];

    const messages = await db
        .select()
        .from(DBMessage)
        .where(eq(DBMessage.chatId, chatData.id))
        .orderBy(asc(DBMessage.createdAt));

    return (
        <PreviewChat
            id={chatId}
            env={{
                inSpace: !!spaceData,
                spaceId: spaceData ? spaceData.id : undefined,
                spaceName: spaceData ? spaceData.spaceTitle : undefined,
                spaceDescription: spaceData ? (spaceData.spaceDescription ?? undefined) : undefined,
            }}
            initialMessages={convertToUIMessages(messages)}
            session={session}
            autoResume={true}
            initialModel={selectedModel}
        />
    );
}
