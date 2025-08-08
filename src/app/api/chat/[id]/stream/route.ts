import { getSession } from '@/lib/auth/utils';
import { getStreamContext } from '../../route';
import {
    type Chat,
    chat as DBChat,
    stream as DBStream,
    message as DBMessage,
} from '@/lib/db/schema/app';
import { db } from '@/lib/db';
import { and, asc, eq } from 'drizzle-orm';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { ChatMessage } from '@/lib/ai/types';
import { differenceInSeconds } from 'date-fns';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = await params;

    const streamContext = getStreamContext();
    const resumeRequestedAt = new Date();

    if (!streamContext) {
        return new Response(null, { status: 204 });
    }

    if (!chatId) {
        return new Response(JSON.stringify({ code: 'BAD_REQUEST', cause: 'chatId is required' }), {
            status: 400,
        });
    }

    const session = await getSession();
    if (!session) {
        return new Response(JSON.stringify({ code: 'UNAUTHORIZED', cause: 'Unauthorized' }), {
            status: 401,
        });
    }

    let chat: Chat;

    try {
        const chats = await db
            .select()
            .from(DBChat)
            .where(and(eq(DBChat.id, chatId), eq(DBChat.userId, session.userId)))
            .limit(1);

        if (chats.length === 0) {
            return new Response(JSON.stringify({ code: 'NOT_FOUND', cause: 'Chat not found' }), {
                status: 404,
            });
        }

        chat = chats[0];
    } catch (_) {
        return new Response(
            JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', cause: 'Internal server error' }),
            { status: 500 }
        );
    }

    if (!chat) {
        return new Response(JSON.stringify({ code: 'NOT_FOUND', cause: 'Chat not found' }), {
            status: 404,
        });
    }

    const streamIdsResult = await db
        .select({ id: DBStream.id })
        .from(DBStream)
        .where(eq(DBStream.chatId, chatId))
        .orderBy(asc(DBStream.createdAt));

    const streamIds = streamIdsResult.map(({ id }) => id);

    if (streamIds.length === 0) {
        return new Response(JSON.stringify({ code: 'NOT_FOUND', cause: 'Stream not found' }), {
            status: 404,
        });
    }

    const recentStreamId = streamIds.at(-1);
    if (!recentStreamId) {
        return new Response(JSON.stringify({ code: 'NOT_FOUND', cause: 'Stream not found' }), {
            status: 404,
        });
    }

    const emptyDataStream = createUIMessageStream<ChatMessage>({
        execute: () => {},
    });

    const stream = await streamContext.resumableStream(recentStreamId, () =>
        emptyDataStream.pipeThrough(new JsonToSseTransformStream())
    );

    if (!stream) {
        const messages = await db
            .select()
            .from(DBMessage)
            .where(eq(DBMessage.chatId, chatId))
            .orderBy(asc(DBMessage.createdAt));

        const mostRecentMessage = messages.at(-1);
        if (!mostRecentMessage) {
            return new Response(JSON.stringify({ code: 'NOT_FOUND', cause: 'Message not found' }), {
                status: 404,
            });
        }

        if (mostRecentMessage.role !== 'assistant') {
            return new Response(emptyDataStream, { status: 200 });
        }

        const messageCreatedAt = new Date(mostRecentMessage.createdAt);
        if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
            return new Response(emptyDataStream, { status: 200 });
        }

        const restoredStream = createUIMessageStream<ChatMessage>({
            execute: ({ writer }) => {
                writer.write({
                    type: 'data-appendMessage',
                    data: JSON.stringify(mostRecentMessage),
                    transient: true,
                });
            },
        });

        return new Response(restoredStream.pipeThrough(new JsonToSseTransformStream()), {
            status: 200,
        });
    }

    return new Response(stream, { status: 200 });
}
