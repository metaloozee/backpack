'use client';

import * as React from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/Input';
import { cn } from '@/lib/utils';
import { ChatMessages } from '@/components/chat/Messages';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';

export function Chat({
    id,
    savedMessages = [],
    query,
}: {
    id: string;
    savedMessages?: Array<Message>;
    query?: string;
}) {
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
        body: { id },
        onFinish: () => {
            // commenting this since im too lazy to implement database at this point.
            // window.history.replaceState({}, '', `/c/${id}`);
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
                'h-screen flex flex-col w-full container stretch space-y-5',
                messages.length === 0
                    ? 'justify-center items-center'
                    : 'items-center justify-between'
            )}
        >
            {messages.length > 0 && (
                <ScrollArea className="w-full flex-grow max-w-2xl">
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
            />
        </div>
    );
}
