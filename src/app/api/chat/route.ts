import { convertToCoreMessages, smoothStream, streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/env.mjs';

import { getUserAuth } from '@/lib/auth/utils';
import { api } from '@/lib/trpc/api';

export const maxDuration = 30;

const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { session } = await getUserAuth();
        if (!session) {
            throw new Error('Access Denied');
        }

        const { messages, id: chatId, spaceId } = await req.json();
        if (!messages || !chatId) {
            throw new Error('Invalid Body');
        }

        const result = await streamText({
            model: openrouter('google/gemini-2.0-flash-001'),
            messages: convertToCoreMessages(messages).filter(
                (message) => message.content.length > 0
            ),
            experimental_transform: smoothStream(),
            async onFinish({ response }) {
                try {
                    await api.chat.saveChat.mutate({
                        chat: {
                            id: chatId,
                            userId: session.user.id,
                            spaceId: spaceId,
                            chatName: convertToCoreMessages(messages)[0].content.toString(),
                            messages: [...convertToCoreMessages(messages), ...response.messages],
                        },
                    });
                } catch (error) {}
            },
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error(error);

        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'an unknown error occurred.',
                status: 500,
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
