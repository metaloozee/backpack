'use client';

import * as React from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/Input';
import { cn } from '@/lib/utils';
import { ChatMessages } from '@/components/chat/messages';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChatData } from '@/app/(main)/(spaces)/s/[id]/page';
import { Attachment, UIMessage } from 'ai';
import { Session } from 'next-auth';
import { generateUUID } from '@/lib/ai/utils';

export function Chat({
    id,
    spaceId,
    initialMessages,
    session,
    autoResume,
    chatsData,
}: {
    id: string;
    spaceId?: string;
    initialMessages: Array<UIMessage>;
    session: Session | null;
    autoResume: boolean;
    chatsData?: Array<ChatData>;
}) {
    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    const [webSearch, setWebSearch] = React.useState(true);
    const [knowledgeSearch, setKnowledgeSearch] = React.useState(false);
    const [academicSearch, setAcademicSearch] = React.useState(false);

    const {
        messages,
        setMessages,
        handleSubmit,
        input,
        setInput,
        append,
        status,
        stop,
        reload,
        experimental_resume,
        data,
    } = useChat({
        id,
        initialMessages,
        generateId: generateUUID,
        sendExtraMessageFields: true,
        experimental_prepareRequestBody: (body) => {
            return {
                id,
                spaceId: spaceId ?? null,
                message: body.messages.at(-1),
                webSearch,
                knowledgeSearch,
                academicSearch,
            };
        },
        onFinish: () => {
            if (messages.length === 0) {
                window.history.pushState({}, '', `/c/${id}`);
            }
        },
        onError: (error) => {
            toast.error('uh oh!', { description: error.message });
        },
    });

    const searchParams = useSearchParams();
    const query = searchParams.get('query');
    const [hasAppendedQuery, setHasAppendedQuery] = React.useState(false);

    React.useEffect(() => {
        if (query && !hasAppendedQuery) {
            append({
                role: 'user',
                content: query,
            });

            setHasAppendedQuery(true);
            window.history.replaceState({}, '', `/c/${id}`);
        }
    }, [query, append, hasAppendedQuery, id]);

    const [attachments, setAttachments] = React.useState<Array<Attachment>>([]);

    return (
        <div
            className={cn(
                'h-screen mx-auto flex flex-col w-full',
                messages.length === 0
                    ? isSpaceChat
                        ? 'justify-start items-start'
                        : 'container justify-center items-center'
                    : 'items-center justify-between'
            )}
        >
            {messages.length > 0 && (
                <ScrollArea className="w-full grow">
                    <ChatMessages
                        messages={messages}
                        setMessages={setMessages}
                        reload={reload}
                        chatId={id}
                        status={status}
                    />
                </ScrollArea>
            )}

            <InputPanel
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
                webSearch={webSearch}
                setWebSearch={setWebSearch}
                knowledgeSearch={knowledgeSearch}
                setKnowledgeSearch={setKnowledgeSearch}
                academicSearch={academicSearch}
                setAcademicSearch={setAcademicSearch}
            />
        </div>
    );
}
