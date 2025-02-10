'use client';

import * as React from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Input as InputPanel } from '@/components/Input';
import { cn } from '@/lib/utils';

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
            window.history.replaceState({}, '', `/c/${id}`);
        },
        onError: (error) => {},
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
                'flex flex-col w-full max-w-3xl container stretch',
                messages.length === 0 ? ' h-screen justify-center items-center' : ''
            )}
        >
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
