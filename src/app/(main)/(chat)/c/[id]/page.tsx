import { convertToUIMessages } from '@/lib/ai/convertToUIMessages';
import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { Chat, chats } from '@/lib/db/schema/app';
import { CoreMessage } from 'ai';
import { and, eq } from 'drizzle-orm';
import { Chat as PreviewChat } from '@/components/Chat';
import { notFound } from 'next/navigation';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    await checkAuth();
    const { session } = await getUserAuth();

    const user = session!.user;
    const { id: chatId } = await params;

    const [chatData] = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

    if (!chatData) {
        return notFound();
    }

    const chat: Chat = {
        ...chatData,
        messages: convertToUIMessages(chatData.messages as Array<CoreMessage>),
    };

    return (
        <PreviewChat
            id={chatId}
            spaceId={chat.spaceId && chat.spaceId.length > 0 ? (chat.spaceId as string) : undefined}
            savedMessages={chat.messages}
        />
    );
}
