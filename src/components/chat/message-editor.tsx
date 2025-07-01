'use client';

import { useRef, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useTRPC } from '@/lib/trpc/trpc';

import { ChatRequestOptions, Message } from 'ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UseChatHelpers } from '@ai-sdk/react';
import { useMutation } from '@tanstack/react-query';
import { CornerDownLeftIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

export type MessageEditorProps = {
    message: Message;
    setMode: Dispatch<SetStateAction<'edit' | 'view'>>;
    setMessages: UseChatHelpers['setMessages'];
    reload: UseChatHelpers['reload'];
};

export function MessageEditor({ message, setMode, setMessages, reload }: MessageEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftContent, setDraftContent] = useState(message.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const trpc = useTRPC();
    const mutation = useMutation(trpc.chat.deleteTrailingMessages.mutationOptions());

    useEffect(() => {
        if (textareaRef.current) {
            adjustHeight();
        }
    });

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
        }
    };

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftContent(event.target.value);
        adjustHeight();
    };

    const handleSave = async () => {
        if (isSubmitting || !draftContent.trim()) return;
        setIsSubmitting(true);

        try {
            await mutation.mutateAsync({
                messageId: message.id,
            });

            // @ts-expect-error TODO: UIMessage in setMessages is not typed correctly
            setMessages((messages) => {
                const index = messages.findIndex((m) => m.id === message.id);

                if (index !== -1) {
                    const updatedMessage = {
                        ...message,
                        content: draftContent,
                        parts: [{ type: 'text', text: draftContent }],
                    };

                    return [...messages.slice(0, index), updatedMessage];
                }

                return messages;
            });

            setMode('view');
            reload();
        } catch (error) {
            toast.error('Failed to save message');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setDraftContent(message.content);
        setMode('view');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className="w-full mx-auto overflow-hidden">
            <div className="text-primary bg-neutral-900 border px-4 py-3 rounded-t-xl rounded-bl-xl overflow-auto">
                <Textarea
                    ref={textareaRef}
                    value={draftContent}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Edit your message..."
                    autoFocus
                    rows={0}
                    className="resize-none w-full bg-transparent ring-0 border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex justify-end items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <XIcon className="size-3" />
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={
                            isSubmitting ||
                            !draftContent.trim() ||
                            draftContent.trim() === message.content
                        }
                    >
                        <CornerDownLeftIcon className="size-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
