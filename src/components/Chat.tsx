'use client';

import * as React from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/Input';
import { cn } from '@/lib/utils';
import { ChatMessages } from '@/components/chat/Messages';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { usePathname } from 'next/navigation';
import { ChatData } from '@/app/(main)/(spaces)/s/[id]/page';

export function Chat({
    id,
    savedMessages = [],
    query,
    spaceId,
    chatsData,
}: {
    id: string;
    savedMessages?: Array<Message>;
    query?: string;
    spaceId?: string;
    chatsData?: Array<ChatData>;
}) {
    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    const [webSearch, setWebSearch] = React.useState(true);
    const [knowledgeBase, setKnowledgeBase] = React.useState(false);

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        setMessages,
        stop,
        append,
        data,
        setData,
    } = useChat({
        initialMessages: savedMessages,
        body: { id, spaceId: spaceId, webSearch, knowledgeSearch: knowledgeBase },
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

    React.useEffect(() => {
        setMessages(savedMessages);
    }, [id]);

    const onQuerySelect = (query: string) => {
        append({
            role: 'user',
            content: query,
        });
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setData(undefined);
        handleSubmit(e);
    };

    return (
        <div
            className={cn(
                'h-screen flex flex-col w-full stretch',
                messages.length === 0
                    ? isSpaceChat
                        ? 'justify-start items-start'
                        : 'container justify-center items-center'
                    : 'items-center justify-between'
            )}
        >
            {messages.length > 0 && (
                <ScrollArea className="w-full flex-grow max-w-3xl">
                    <ChatMessages
                        messages={messages}
                        data={data}
                        onQuerySelect={onQuerySelect}
                        isLoading={isLoading}
                        chatId={id}
                    />
                </ScrollArea>
            )}

            <InputPanel
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={onSubmit}
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
            />
        </div>
    );
}
