import { cookies } from 'next/headers';

import { convertToCoreMessages, smoothStream, streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { z } from 'zod';
import { env } from '@/lib/env.mjs';

export const maxDuration = 30;

const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages, id: chatId } = await req.json();

        const cookieStore = await cookies();

        const result = await streamText({
            model: openrouter('google/gemini-2.0-flash-001'),
            messages: convertToCoreMessages(messages).filter(
                (message) => message.content.length > 0
            ),
            experimental_transform: smoothStream(),
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
