'use client';

import * as React from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/Input';
import { cn } from '@/lib/utils';
import { ChatMessages } from '@/components/chat/Messages';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChatData } from '@/app/(main)/(spaces)/s/[id]/page';
import { UIMessage } from 'ai';
import { Session } from 'next-auth';

export function Chat({
    id,
    spaceId,
    initialMessages,
    session,
    autoResume,
}: {
    id: string;
    spaceId?: string;
    initialMessages: Array<UIMessage>;
    session: Session;
    autoResume: boolean;
}) {
    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    const [webSearch, setWebSearch] = React.useState(true);
    const [knowledgeBase, setKnowledgeBase] = React.useState(false);
    const [academicSearch, setAcademicSearch] = React.useState(false);
    const [socialSearch, setSocialSearch] = React.useState(false);

    const { messages, setMessages, stop, append, reload, status } = useChat({
        initialMessages,
        body: {
            id,
            spaceId: spaceId ?? null,
            webSearch,
            knowledgeSearch: knowledgeBase,
            academicSearch,
            socialSearch,
        },
        onFinish: () => {
            if (messages.length === 0) {
                window.history.pushState({}, '', `/c/${id}`);
            }
        },
        onError: (error) => {
            toast.error('uh oh!', { description: error.message });
        },
        sendExtraMessageFields: false,
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

            {/* <InputPanel
                isLoading={isLoading}
                messages={messages}
                setMessages={setMessages}
                stop={stop}
                query={query}
                append={append}
                chatsData={chatsData}
                webSearch={webSearch}
                setWebSearch={setWebSearch}
                knowledgeBase={knowledgeBase}
                setKnowledgeBase={setKnowledgeBase}
                academicSearch={academicSearch}
                setAcademicSearch={setAcademicSearch}
                socialSearch={socialSearch}
                setSocialSearch={setSocialSearch}
            /> */}
        </div>
    );
}
