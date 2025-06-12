import { convertToUIMessages } from '@/lib/ai/convertToUIMessages';
import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { chat as DBChat, message as DBMessage } from '@/lib/db/schema/app';
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

    const messages = await db
        .select()
        .from(DBMessage)
        .where(eq(DBMessage.chatId, chatData.id))
        .orderBy(asc(DBMessage.createdAt));

    return (
        <PreviewChat
            id={chatId}
            spaceId={
                chatData.spaceId && chatData.spaceId.length > 0
                    ? (chatData.spaceId as string)
                    : undefined
            }
            initialMessages={convertToUIMessages(messages)}
            session={session}
            autoResume={true}
        />
    );
}
