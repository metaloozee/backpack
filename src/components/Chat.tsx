'use client';

import * as React from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/Input';
import { cn } from '@/lib/utils';
import { ChatMessages } from '@/components/chat/messages';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { usePathname, useSearchParams } from 'next/navigation';
import { Attachment, UIMessage } from 'ai';
import { Session } from 'next-auth';
import { generateUUID } from '@/lib/ai/utils';
import { Chat as ChatType } from '@/lib/db/schema/app';
import ChatDisplayCard from './chat/DisplayCard';
import { Separator } from './ui/separator';
import { BookOpenIcon } from 'lucide-react';

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
    chatsData?: Array<ChatType>;
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
                spaceId: spaceId ?? undefined,
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
                'flex flex-col w-full h-screen',
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

            {isSpaceChat && chatsData && chatsData.length > 0 && messages.length === 0 && (
                <div className="flex flex-col gap-2 w-full my-20">
                    <div className="flex flex-row gap-2 items-center">
                        <BookOpenIcon className="size-5" />
                        <h2 className="text-lg font-medium">Chat History</h2>
                    </div>
                    <Separator className="my-2 max-w-[25vw]" />
                    {chatsData.map((chat) => (
                        <ChatDisplayCard key={chat.id} chat={chat} />
                    ))}
                </div>
            )}
        </div>
    );
}
