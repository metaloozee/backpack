"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { CornerDownLeftIcon, XIcon } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/ai/types";
import { useTRPC } from "@/lib/trpc/trpc";

export type MessageEditorProps = {
	message: ChatMessage;
	setMode: Dispatch<SetStateAction<"edit" | "view">>;
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
};

export function MessageEditor({ message, setMode, setMessages, regenerate }: MessageEditorProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [draftContent, setDraftContent] = useState(
		message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")
	);
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
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
		}
	};

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setDraftContent(event.target.value);
		adjustHeight();
	};

	const handleSave = async () => {
		if (isSubmitting || !draftContent.trim()) {
			return;
		}
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
						parts: [{ type: "text", text: draftContent }],
					};

					return [...messages.slice(0, index), updatedMessage];
				}

				return messages;
			});

			setMode("view");
			regenerate();
		} catch {
			toast.error("Failed to save message");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setDraftContent(message.parts.map((part) => (part.type === "text" ? part.text : "")).join(""));
		setMode("view");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Escape") {
			handleCancel();
		} else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSave();
		}
	};

	return (
		<div className="mx-auto w-full overflow-hidden">
			<div className="overflow-auto rounded-t-xl rounded-bl-xl border bg-neutral-900 px-4 py-3 text-primary">
				<Textarea
					autoFocus
					className="w-full resize-none border-0 bg-transparent text-sm ring-0 placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
					onChange={handleInput}
					onKeyDown={handleKeyDown}
					placeholder="Edit your message..."
					ref={textareaRef}
					rows={0}
					value={draftContent}
				/>
				<div className="flex items-center justify-end gap-2">
					<Button
						className="text-muted-foreground hover:text-foreground"
						disabled={isSubmitting}
						onClick={handleCancel}
						size="sm"
						variant="ghost"
					>
						<XIcon className="size-3" />
					</Button>
					<Button
						disabled={
							isSubmitting ||
							!draftContent.trim() ||
							draftContent.trim() ===
								message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")
						}
						onClick={handleSave}
						size="sm"
						variant="default"
					>
						<CornerDownLeftIcon className="size-3" />
					</Button>
				</div>
			</div>
		</div>
	);
}
