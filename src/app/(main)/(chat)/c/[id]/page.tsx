import { convertToUIMessages } from '@/lib/ai/convertToUIMessages';
import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { chat as DBChat, message as DBMessage, spaces as DBSpace } from '@/lib/db/schema/app';
import { and, eq, asc } from 'drizzle-orm';
import { Chat as PreviewChat } from '@/components/Chat';
import { notFound } from 'next/navigation';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    await checkAuth();
    const { session } = await getUserAuth();

    const user = session!.user;
    const { id: chatId } = await params;

    const [chatData] = await db
        .select()
        .from(DBChat)
        .where(and(eq(DBChat.id, chatId), eq(DBChat.userId, user.id)));

    if (!chatData) {
        return notFound();
    }

    const [spaceData] = chatData.spaceId
        ? await db
              .select()
              .from(DBSpace)
              .where(and(eq(DBSpace.id, chatData.spaceId ?? ''), eq(DBSpace.userId, user.id)))
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
        />
    );
}
