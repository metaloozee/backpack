/** biome-ignore-all lint/suspicious/noExplicitAny: any */
"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import type { Session } from "better-auth";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DisplayChats from "@/components/chat/display-chats";
import { ChatMessages } from "@/components/chat/messages";
import { SpaceIntro } from "@/components/chat/space-intro";
import { Input as InputPanel } from "@/components/chat-input";
import { useDataStream } from "@/components/data-stream-provider";
import type { ToolsState } from "@/lib/ai/tools";
import type { Attachment, ChatMessage } from "@/lib/ai/types";
import { fetchWithErrorHandlers } from "@/lib/ai/utils";
import type { Chat as ChatType, Knowledge } from "@/lib/db/schema/app";
import { useAutoResume } from "@/lib/hooks/use-auto-resume";
import {
	type ChatInfiniteData,
	prependChatToInfiniteData,
} from "@/lib/trpc/cache-utils";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

function useQueryAppend({
	sendMessage,
}: {
	sendMessage: (message: any) => void;
}) {
	"use no memo";

	const [query, setQuery] = useQueryState("query", parseAsString);
	const hasAppendedQuery = useRef(false);

	useEffect(() => {
		if (query && !hasAppendedQuery.current) {
			sendMessage({
				role: "user",
				parts: [{ type: "text", text: query }],
			});

			hasAppendedQuery.current = true;
			setQuery(null);
		}
	}, [query, sendMessage, setQuery]);
}

export function Chat({
	id,
	env,
	initialMessages,
	autoResume,
}: {
	id: string;
	env: {
		inSpace: boolean;
		spaceId?: string;
		spaceName?: string;
		spaceDescription?: string;
		spaceCustomInstructions?: string;
	};
	initialMessages: ChatMessage[];
	session: Session | null;
	autoResume: boolean;
	initialModel?: string;
	initialTools?: ToolsState;
	initialMode?: string;
	initialAgent?: string;
	initialMcpServers?: Record<string, boolean>;
}) {
	const pathname = usePathname();
	const isSpaceChat = env.inSpace || pathname.startsWith("/s/");
	const { data: spaceOverview, status: spaceStatus } = useSpaceOverview(
		env.spaceId,
		isSpaceChat
	);
	const { data: knowledgeData, status: knowledgeStatus } =
		useKnowledgeOverview(env.spaceId);

	const [input, setInput] = useState<string>("");
	const [attachments, setAttachments] = useState<Attachment[]>([]);

	const { setDataStream } = useDataStream();
	const queryClient = useQueryClient();
	const trpc = useTRPC();

	const generateTempTitle = useCallback((message: ChatMessage): string => {
		const firstTextPart = message.parts.find(
			(part) => part.type === "text"
		);
		if (firstTextPart && "text" in firstTextPart) {
			const text = firstTextPart.text.trim();
			return text.length > 50 ? `${text.slice(0, 50)}...` : text;
		}
		return "New Chat";
	}, []);

	const optimisticallyAddChat = useCallback(
		(message: ChatMessage) => {
			const tempTitle = generateTempTitle(message);
			const newChat: ChatType = {
				id,
				userId: "",
				spaceId: env.spaceId || null,
				title: tempTitle,
				createdAt: new Date(),
			};

			queryClient.setQueryData(
				trpc.chat.getChats.infiniteQueryOptions({ limit: 20 }).queryKey,
				(oldData: ChatInfiniteData | undefined) => {
					if (!oldData) {
						return {
							pages: [
								{ chats: [newChat], nextCursor: undefined },
							],
							pageParams: [null],
						} as ChatInfiniteData;
					}

					return (
						prependChatToInfiniteData(oldData, newChat) ?? oldData
					);
				}
			);

			if (env.spaceId) {
				queryClient.setQueryData(
					trpc.chat.getChats.infiniteQueryOptions({
						limit: 20,
						spaceId: env.spaceId,
					}).queryKey,
					(oldData: ChatInfiniteData | undefined) => {
						if (!oldData) {
							return {
								pages: [
									{ chats: [newChat], nextCursor: undefined },
								],
								pageParams: [null],
							} as ChatInfiniteData;
						}

						return (
							prependChatToInfiniteData(oldData, newChat) ??
							oldData
						);
					}
				);
			}
		},
		[id, env.spaceId, generateTempTitle, queryClient, trpc]
	);

	const [_hasOptimisticallyAdded, setHasOptimisticallyAdded] =
		useState(false);
	const optimisticInvalidationRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null);

	const {
		messages,
		setMessages,
		sendMessage: originalSendMessage,
		status,
		stop,
		regenerate,
		resumeStream,
	} = useChat<ChatMessage>({
		id,
		messages: initialMessages,
		generateId: () => crypto.randomUUID(),
		experimental_throttle: 100,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			fetch: fetchWithErrorHandlers,
			prepareSendMessagesRequest({
				messages,
				id,
				body,
			}: {
				messages: ChatMessage[];
				id: string;
				body: any;
			}) {
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
			setDataStream((ds) =>
				ds
					? [...ds, dataPart as unknown as any]
					: [dataPart as unknown as any]
			);
		},
		onError: (error) => {
			toast.error("uh oh!", { description: error.message });
		},
	});

	const sendMessage = useCallback(
		(message: any) => {
			const fullMessage: ChatMessage = {
				id: message.id || crypto.randomUUID(),
				role: message.role || "user",
				parts: message.parts || [],
			};

			const isFirstMessage =
				initialMessages.length === 0 && messages.length === 0;

			if (isFirstMessage) {
				optimisticallyAddChat(fullMessage);
				setHasOptimisticallyAdded(true);
				if (optimisticInvalidationRef.current) {
					clearTimeout(optimisticInvalidationRef.current);
				}
				optimisticInvalidationRef.current = setTimeout(() => {
					queryClient.invalidateQueries(
						trpc.chat.getChats.pathFilter()
					);
					setHasOptimisticallyAdded(false);
					optimisticInvalidationRef.current = null;
				}, 1000);
			}

			return originalSendMessage(message);
		},
		[
			initialMessages.length,
			messages.length,
			optimisticallyAddChat,
			originalSendMessage,
			queryClient,
			trpc,
		]
	);

	useEffect(
		() => () => {
			if (optimisticInvalidationRef.current) {
				clearTimeout(optimisticInvalidationRef.current);
			}
		},
		[]
	);

	// Computed values
	const showSpaceIntro = isSpaceChat && messages.length === 0;
	const spaceTitle =
		spaceOverview?.spaceData.spaceTitle ??
		env.spaceName ??
		"Untitled space";
	const spaceDescription =
		spaceOverview?.spaceData.spaceDescription ?? env.spaceDescription;
	const spaceCustomInstructions =
		spaceOverview?.spaceData.spaceCustomInstructions ??
		env.spaceCustomInstructions;
	const showSpaceHistory =
		showSpaceIntro &&
		Boolean(env.spaceId) &&
		(spaceOverview?.hasChats ?? false);

	useQueryAppend({ sendMessage });

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
				messages.length > 0
					? "items-center justify-between"
					: "container my-10 items-center justify-center"
			)}
			suppressHydrationWarning
		>
			{messages.length > 0 && (
				<ChatMessages
					chatId={id}
					messages={messages}
					regenerate={regenerate}
					status={status}
				/>
			)}

			{showSpaceIntro && (
				<SpaceIntro
					knowledgeData={knowledgeData}
					knowledgeStatus={knowledgeStatus}
					spaceCustomInstructions={spaceCustomInstructions}
					spaceDescription={spaceDescription}
					spaceId={spaceOverview?.spaceData.id ?? env.spaceId ?? ""}
					spaceStatus={spaceStatus}
					spaceTitle={spaceTitle}
				/>
			)}

			<InputPanel
				attachments={attachments}
				chatId={id}
				input={input}
				messages={messages}
				sendMessage={sendMessage}
				setAttachments={setAttachments}
				setInput={setInput}
				setMessages={setMessages}
				status={status}
				stop={stop}
			/>

			{showSpaceHistory && env.spaceId && (
				<div className="mt-10 flex w-full max-w-3xl flex-col gap-2">
					<DisplayChats spaceId={env.spaceId} />
				</div>
			)}
		</div>
	);
}

const PLACEHOLDER_SPACE_ID = "00000000-0000-0000-0000-000000000000";

export function useKnowledgeOverview(spaceId?: string) {
	const trpc = useTRPC();

	const query = useQuery({
		...trpc.space.getKnowledge.queryOptions({
			// biome-ignore lint/style/noNonNullAssertion: spaceId is guaranteed to be set if enabled is true
			spaceId: spaceId!,
		}),
		enabled: !!spaceId,
		staleTime: 30_000,
		refetchInterval: (queryState) => {
			const data = queryState.state.data as Knowledge[] | undefined;
			const hasInProgress = data?.some(
				(item) =>
					item.status === "pending" || item.status === "processing"
			);
			return hasInProgress ? 5000 : false;
		},
		refetchIntervalInBackground: true,
	});

	if (!spaceId) {
		return {
			data: undefined,
			status: "success" as const,
			isLoading: false,
			isFetching: false,
			isPending: false,
			isSuccess: true,
			isError: false,
			error: null,
			refetch: query.refetch,
			isRefetching: false,
			isStale: false,
		};
	}

	return query;
}

export function useSpaceOverview(spaceId?: string, enabled = true) {
	const trpc = useTRPC();
	const shouldFetch = Boolean(enabled && spaceId);

	const query = useQuery({
		...trpc.space.getSpaceOverview.queryOptions({
			// biome-ignore lint/style/noNonNullAssertion: spaceId is guaranteed to be set if enabled is true
			spaceId: shouldFetch ? spaceId! : PLACEHOLDER_SPACE_ID,
		}),
		enabled: shouldFetch,
		staleTime: 30_000,
	});

	if (!shouldFetch) {
		return {
			data: undefined,
			status: "success" as const,
			isLoading: false,
			isFetching: false,
			isPending: false,
			isSuccess: true,
			isError: false,
			error: null,
			refetch: query.refetch,
			isRefetching: false,
			isStale: false,
		};
	}

	return query;
}
