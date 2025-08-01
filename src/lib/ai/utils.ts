import type { ModelMessage, UIMessage, UIMessagePart } from 'ai';
import { ChatMessage, ChatTools, CustomUIDataTypes } from './types';
import { formatISO } from 'date-fns';
import type { Message } from '@/lib/db/schema/app';

export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

type ResponseMessageWithoutId = ModelMessage | UIMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
    const userMessages = messages.filter((message) => message.role === 'user');
    return userMessages.at(-1);
}

export function getTrailingMessageId({
    messages,
}: {
    messages: Array<ResponseMessage>;
}): string | null {
    const trailingMessage = messages.at(-1);

    if (!trailingMessage) return null;

    return trailingMessage.id;
}

export function sanitizeText(text: string) {
    return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: Message[]): ChatMessage[] {
    return messages.map((message) => ({
        id: message.id,
        role: message.role as 'user' | 'assistant' | 'system',
        parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
        metadata: {
            createdAt: formatISO(message.createdAt),
        },
    }));
}

export function getTextFromMessage(message: ChatMessage): string {
    return message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('');
}

export const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        const { code, cause } = await response.json();
        throw new Error(`${code}: ${cause}`);
    }

    return response.json();
};

export async function fetchWithErrorHandlers(input: RequestInfo | URL, init?: RequestInit) {
    try {
        const response = await fetch(input, init);

        if (!response.ok) {
            const { code, cause } = await response.json();
            throw new Error(`${code}: ${cause}`);
        }

        return response;
    } catch (error: unknown) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error('No internet connection');
        }

        throw error;
    }
}
