import { Attachment, UIMessage } from 'ai';
import { type Message } from '@/lib/db/schema/app';

export function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    return messages.map((message) => ({
        id: message.id,
        parts: message.parts as UIMessage['parts'],
        role: message.role as UIMessage['role'],
        content: '',
        createdAt: message.createdAt,
        experimental_attachments: (message.attachments as Array<Attachment>) ?? [],
    }));
}
