/** biome-ignore-all lint/suspicious/noExplicitAny: any */
"use client";

import { randomUUID } from "node:crypto";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { Session } from "better-auth";
import { BookOpenIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DisplayChats from "@/components/chat/display-chats";
import { ChatMessages } from "@/components/chat/messages";
import { Input as InputPanel } from "@/components/chat-input";
import { useDataStream } from "@/components/data-stream-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getDefaultToolsState, type ToolsState } from "@/lib/ai/tools";
import type { Attachment, ChatMessage } from "@/lib/ai/types";
import { fetchWithErrorHandlers } from "@/lib/ai/utils";
import type { Chat as ChatType } from "@/lib/db/schema/app";
import { useAutoResume } from "@/lib/hooks/use-auto-resume";
import { cn } from "@/lib/utils";

export function Chat({
	id,
	env,
	initialMessages,
	autoResume,
	chatsData,
	initialModel,
	initialTools,
	initialMode,
	initialAgent,
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
	chatsData?: ChatType[];
	initialModel?: string;
	initialTools?: ToolsState;
	initialMode?: string;
	initialAgent?: string;
}) {
	const pathname = usePathname();
	const isSpaceChat = pathname.startsWith("/s/");

	const [input, setInput] = useState<string>("");
	const [tools, setTools] = useState<ToolsState>(initialTools ?? getDefaultToolsState());

	const { setDataStream } = useDataStream();

	const { messages, setMessages, sendMessage, status, stop, regenerate, resumeStream } = useChat<ChatMessage>({
		id,
		messages: initialMessages,
		generateId: () => randomUUID(),
		experimental_throttle: 100,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			fetch: fetchWithErrorHandlers,
			// biome-ignore lint/nursery/noShadow: false positive
			prepareSendMessagesRequest({ messages, id, body }: { messages: ChatMessage[]; id: string; body: any }) {
				return {
					body: {
						id,
						env,
						message: messages.at(-1),
						...body,
					},
				};
			},
		}),
		onData: (dataPart) => {
			setDataStream((ds) => (ds ? [...ds, dataPart as unknown as any] : [dataPart as unknown as any]));
		},
		onError: (error) => {
			toast.error("uh oh!", { description: error.message });
		},
	});

	const searchParams = useSearchParams();
	const query = searchParams.get("query");
	const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

	useEffect(() => {
		if (query && !hasAppendedQuery) {
			sendMessage({
				role: "user",
				parts: [{ type: "text", text: query }],
			});

			setHasAppendedQuery(true);
			window.history.replaceState({}, "", `/c/${id}`);
		}
	}, [query, sendMessage, hasAppendedQuery, id]);

	const [attachments, setAttachments] = useState<Attachment[]>([]);

	useAutoResume({
		autoResume,
		initialMessages,
		resumeStream,
		setMessages,
	});

	return (
		<div
			className={cn(
				"flex h-full w-full flex-col",
				messages.length === 0
					? isSpaceChat
						? "items-start justify-start"
						: "container items-center justify-center"
					: "items-center justify-between"
			)}
			suppressHydrationWarning
		>
			{messages.length > 0 && (
				<ScrollArea className="h-full w-full">
					<ChatMessages
						chatId={id}
						messages={messages}
						regenerate={regenerate}
						setMessages={setMessages}
						status={status}
					/>
				</ScrollArea>
			)}

			<InputPanel
				attachments={attachments}
				chatId={id}
				initialAgent={initialAgent}
				initialMode={initialMode}
				initialModel={initialModel}
				input={input}
				messages={messages}
				sendMessage={sendMessage}
				setAttachments={setAttachments}
				setInput={setInput}
				setMessages={setMessages}
				setTools={setTools}
				status={status}
				stop={stop}
				tools={tools}
			/>

			{isSpaceChat && chatsData && chatsData.length > 0 && messages.length === 0 && (
				<div className="my-20 flex w-full flex-col gap-2">
					<div className="flex flex-row items-center gap-2">
						<BookOpenIcon className="size-5" />
						<h2 className="font-medium text-lg">Chat History</h2>
					</div>
					<Separator className="my-2 max-w-[25vw]" />
					<DisplayChats spaceId={chatsData[0].spaceId ?? undefined} />
				</div>
			)}
		</div>
	);
}
