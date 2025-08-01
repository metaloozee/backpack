'use client';

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/chat-input';
import { cn } from '@/lib/utils';
import { ChatMessages } from '@/components/chat/messages';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { usePathname, useSearchParams } from 'next/navigation';
import { DefaultChatTransport, UIMessage } from 'ai';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/ai/utils';
import { Chat as ChatType } from '@/lib/db/schema/app';
import { Separator } from './ui/separator';
import { BookOpenIcon } from 'lucide-react';
import DisplayChats from './chat/display-chats';
import { useAutoResume } from '@/lib/hooks/use-auto-resume';
import { type Session } from 'better-auth';
import { getDefaultToolsState, type ToolsState } from '@/lib/ai/tools';

import { useDataStream } from './data-stream-provider';
import { Attachment, ChatMessage } from '@/lib/ai/types';
import { useState } from 'react';

export function Chat({
    id,
    env,
    initialMessages,
    session,
    autoResume,
    chatsData,
    initialModel,
}: {
    id: string;
    env: {
        inSpace: boolean;
        spaceId?: string;
        spaceName?: string;
        spaceDescription?: string;
    };
    initialMessages: ChatMessage[];
    session: Session | null;
    autoResume: boolean;
    chatsData?: Array<ChatType>;
    initialModel?: string;
}) {
    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    const [input, setInput] = useState<string>('');
    const [tools, setTools] = React.useState<ToolsState>(getDefaultToolsState());

    const { setDataStream } = useDataStream();

    const { messages, setMessages, sendMessage, status, stop, regenerate, resumeStream } =
        useChat<ChatMessage>({
            id,
            messages: initialMessages,
            generateId: generateUUID,
            experimental_throttle: 100,
            transport: new DefaultChatTransport({
                api: '/api/chat',
                fetch: fetchWithErrorHandlers,
                prepareSendMessagesRequest({ messages, id, body }) {
                    return {
                        body: {
                            id,
                            env,
                            message: messages.at(-1),
                            webSearch: tools.webSearch,
                            knowledgeSearch: tools.knowledgeSearch,
                            academicSearch: tools.academicSearch,
                            ...body,
                        },
                    };
                },
            }),
            onData: (dataPart) => {
                setDataStream((ds) => (ds ? [...ds, dataPart as any] : [dataPart as any]));
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
            sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: query }],
            });

            setHasAppendedQuery(true);
            window.history.replaceState({}, '', `/c/${id}`);
        }
    }, [query, sendMessage, hasAppendedQuery, id]);

    const [attachments, setAttachments] = useState<Array<Attachment>>([]);

    useAutoResume({
        autoResume,
        initialMessages,
        resumeStream,
        setMessages,
    });

    return (
        <div
            className={cn(
                'flex flex-col w-full h-full',
                messages.length === 0
                    ? isSpaceChat
                        ? 'justify-start items-start'
                        : 'container justify-center items-center'
                    : 'items-center justify-between'
            )}
        >
            {messages.length > 0 && (
                <ScrollArea className="w-full h-full">
                    <ChatMessages
                        messages={messages}
                        setMessages={setMessages}
                        regenerate={regenerate}
                        chatId={id}
                        status={status}
                    />
                </ScrollArea>
            )}

            <InputPanel
                chatId={id}
                input={input}
                setInput={setInput}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                sendMessage={sendMessage}
                tools={tools}
                setTools={setTools}
                initialModel={initialModel}
            />

            {isSpaceChat && chatsData && chatsData.length > 0 && messages.length === 0 && (
                <div className="flex flex-col gap-2 w-full my-20">
                    <div className="flex flex-row gap-2 items-center">
                        <BookOpenIcon className="size-5" />
                        <h2 className="text-lg font-medium">Chat History</h2>
                    </div>
                    <Separator className="my-2 max-w-[25vw]" />
                    <DisplayChats spaceId={chatsData[0].spaceId ?? undefined} />
                </div>
            )}
        </div>
    );
}
