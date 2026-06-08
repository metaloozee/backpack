/** biome-ignore-all lint/suspicious/noExplicitAny: any */
"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import type { Session } from "better-auth";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type ArtifactSnapshot,
	ArtifactWorkspace,
} from "@/components/artifacts/artifact-workspace";
import DisplayChats from "@/components/chat/display-chats";
import { ChatMessages } from "@/components/chat/messages";
import { SpaceIntro } from "@/components/chat/space-intro";
import { Input as InputPanel } from "@/components/chat-input";
import { useDataStream } from "@/components/data-stream-provider";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ToolsState } from "@/lib/ai/tool-registry";
import type { Attachment, ChatMessage } from "@/lib/ai/types";
import { fetchWithErrorHandlers } from "@/lib/ai/utils";
import type { ArtifactStreamEvent } from "@/lib/artifacts/types";
import type { Chat as ChatType, Knowledge } from "@/lib/db/schema/app";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { useSetMobileHeader } from "@/lib/mobile-header-context";
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

type SetArtifactSnapshots = React.Dispatch<
	React.SetStateAction<Record<string, ArtifactSnapshot>>
>;

function openArtifactSnapshot({
	event,
	setOpenArtifactId,
	setArtifactSnapshots,
}: {
	event: Extract<ArtifactStreamEvent, { event: "open" }>;
	setOpenArtifactId: React.Dispatch<React.SetStateAction<string | null>>;
	setArtifactSnapshots: SetArtifactSnapshots;
}) {
	setOpenArtifactId(event.artifactId);
	setArtifactSnapshots((current) => ({
		...current,
		[event.artifactId]: {
			artifactId: event.artifactId,
			chatId: event.chatId,
			kind: event.kind,
			title: event.title,
			content: event.content,
			status: event.status,
			versionNumber: event.versionNumber,
		},
	}));
}

function appendArtifactDelta({
	event,
	setArtifactSnapshots,
}: {
	event: Extract<ArtifactStreamEvent, { event: "delta" }>;
	setArtifactSnapshots: SetArtifactSnapshots;
}) {
	setArtifactSnapshots((current) => {
		const existing = current[event.artifactId];
		if (!existing) {
			return current;
		}

		return {
			...current,
			[event.artifactId]: {
				...existing,
				content: `${existing.content}${event.delta}`,
				status: "streaming",
			},
		};
	});
}

function finishArtifactSnapshot({
	event,
	setArtifactSnapshots,
}: {
	event: Extract<ArtifactStreamEvent, { event: "finish" }>;
	setArtifactSnapshots: SetArtifactSnapshots;
}) {
	setArtifactSnapshots((current) => {
		const existing = current[event.artifactId];
		if (!existing) {
			return current;
		}

		return {
			...current,
			[event.artifactId]: {
				...existing,
				content: event.content,
				status: "idle",
				versionNumber: event.versionNumber,
			},
		};
	});
}

function markArtifactIdle({
	artifactId,
	setArtifactSnapshots,
}: {
	artifactId: string;
	setArtifactSnapshots: SetArtifactSnapshots;
}) {
	setArtifactSnapshots((current) => {
		const existing = current[artifactId];
		if (!existing) {
			return current;
		}

		return {
			...current,
			[artifactId]: {
				...existing,
				status: "idle",
			},
		};
	});
}

function ignoreAsyncError(error: unknown) {
	if (error instanceof Error) {
		return undefined;
	}
	return undefined;
}

function handleArtifactStreamEvent({
	event,
	invalidateArtifactQueries,
	setArtifactSnapshots,
	setOpenArtifactId,
}: {
	event: ArtifactStreamEvent;
	invalidateArtifactQueries: (artifactId: string) => void;
	setArtifactSnapshots: SetArtifactSnapshots;
	setOpenArtifactId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
	switch (event.event) {
		case "open":
			openArtifactSnapshot({
				event,
				setOpenArtifactId,
				setArtifactSnapshots,
			});
			return;
		case "delta":
			appendArtifactDelta({
				event,
				setArtifactSnapshots,
			});
			return;
		case "finish":
			finishArtifactSnapshot({
				event,
				setArtifactSnapshots,
			});
			invalidateArtifactQueries(event.artifactId);
			return;
		case "error":
			toast.error(event.message);
			if (event.artifactId) {
				markArtifactIdle({
					artifactId: event.artifactId,
					setArtifactSnapshots,
				});
			}
			return;
		default:
			return;
	}
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex chat component
export function Chat({
	id,
	env,
	initialMessages,
	session,
	initialModel,
	initialTools,
	initialMode,
	initialAgent,
	initialMcpServers,
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
	const [openArtifactId, setOpenArtifactId] = useState<string | null>(null);
	const [artifactSnapshots, setArtifactSnapshots] = useState<
		Record<string, ArtifactSnapshot>
	>({});

	const { dataStream, setDataStream } = useDataStream();
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const processedDataStreamLengthRef = useRef(0);

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
				activeStreamId: null,
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
						artifactContext: {
							activeArtifactId: openArtifactId ?? undefined,
						},
						...body,
					},
				};
			},
		}),
		resume: initialMessages.length > 0,
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

	useEffect(() => {
		setDataStream([]);
		processedDataStreamLengthRef.current = 0;
	}, [setDataStream]);

	const invalidateArtifactQueries = useCallback(
		(artifactId: string) => {
			queryClient
				.invalidateQueries({
					queryKey: trpc.artifact.getById.queryOptions({
						artifactId,
					}).queryKey,
				})
				.catch(ignoreAsyncError);
			queryClient
				.invalidateQueries({
					queryKey: trpc.artifact.listByChat.queryOptions({
						chatId: id,
					}).queryKey,
				})
				.catch(ignoreAsyncError);
		},
		[id, queryClient, trpc]
	);

	useEffect(() => {
		const newParts = dataStream.slice(processedDataStreamLengthRef.current);
		processedDataStreamLengthRef.current = dataStream.length;

		for (const part of newParts) {
			if (part.type !== "data-artifact") {
				continue;
			}

			const event = part.data as ArtifactStreamEvent;
			handleArtifactStreamEvent({
				event,
				invalidateArtifactQueries,
				setArtifactSnapshots,
				setOpenArtifactId,
			});
		}
	}, [dataStream, invalidateArtifactQueries]);

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

	const firstUserMessage = messages.find((m) => m.role === "user");
	const chatTitle =
		firstUserMessage?.parts
			?.find((p) => p.type === "text" && "text" in p)
			?.text?.slice(0, 50) ?? null;
	let headerTitle: string | null = null;
	let headerSubtitle: string | null = null;

	if (isSpaceChat) {
		headerTitle = spaceTitle;
		headerSubtitle = chatTitle;
	} else if (chatTitle) {
		headerTitle = chatTitle;
		headerSubtitle = null;
	}

	const showMobileTitle = isSpaceChat || messages.length > 0;
	useSetMobileHeader(
		showMobileTitle ? headerTitle : null,
		messages.length > 0 ? headerSubtitle : null
	);

	const isMobile = useIsMobile();
	const resolvedSpaceId = spaceOverview?.spaceData.id ?? env.spaceId ?? "";

	const inputPanelProps = {
		attachments,
		chatId: id,
		initialAgent,
		initialMcpServers,
		initialMode,
		initialModel,
		initialTools,
		input,
		messages,
		sendMessage,
		session,
		setAttachments,
		setInput,
		setMessages,
		status,
		stop,
	};

	const spaceIntroEl = (
		<SpaceIntro
			knowledgeData={knowledgeData}
			knowledgeStatus={knowledgeStatus}
			spaceCustomInstructions={spaceCustomInstructions}
			spaceDescription={spaceDescription}
			spaceId={resolvedSpaceId}
			spaceStatus={spaceStatus}
			spaceTitle={spaceTitle}
		/>
	);

	const openArtifactSnapshot = openArtifactId
		? artifactSnapshots[openArtifactId]
		: undefined;

	const chatContent = (
		<div className="flex min-h-0 w-full flex-1 flex-col">
			{messages.length > 0 ? (
				<>
					<ChatMessages
						chatId={id}
						messages={messages}
						onOpenArtifact={setOpenArtifactId}
						regenerate={regenerate}
						status={status}
					/>
					<InputPanel
						{...inputPanelProps}
						composerLayout="stickyFooter"
					/>
				</>
			) : null}

			{showSpaceIntro && isMobile ? (
				<div className="flex min-h-0 w-full flex-1 flex-col">
					<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
						<div className="mx-auto w-full max-w-3xl px-4 pt-6">
							{spaceIntroEl}
						</div>
						{showSpaceHistory ? (
							<div className="mt-4 flex w-full flex-col gap-2 overflow-x-hidden px-4 pb-4">
								<DisplayChats spaceId={resolvedSpaceId} />
							</div>
						) : null}
					</div>
					<InputPanel
						{...inputPanelProps}
						composerLayout="stickyFooter"
					/>
				</div>
			) : null}

			{showSpaceIntro && !isMobile ? (
				<div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto">
					<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
						<div className="mx-auto flex w-full max-w-3xl flex-col px-4 pt-24 pb-8 sm:px-6">
							{spaceIntroEl}
							<InputPanel
								{...inputPanelProps}
								composerLayout="inline"
							/>
							{showSpaceHistory ? (
								<div className="mt-6 flex w-full flex-col gap-2">
									<DisplayChats spaceId={resolvedSpaceId} />
								</div>
							) : null}
						</div>
					</div>
				</div>
			) : null}

			{messages.length > 0 || showSpaceIntro ? null : (
				<div className="container mx-auto my-0 flex flex-1 flex-col items-center justify-center sm:my-10">
					<div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-0 md:px-6">
						<InputPanel
							{...inputPanelProps}
							composerLayout="home"
						/>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<div
			className="flex min-h-0 w-full flex-1 overflow-hidden"
			suppressHydrationWarning
		>
			<div
				className={cn(
					"flex min-h-0 flex-1 flex-col",
					openArtifactId && "lg:max-w-[52%]"
				)}
			>
				{chatContent}
			</div>

			{openArtifactId ? (
				<ArtifactWorkspace
					chatId={id}
					className="hidden lg:flex lg:w-[48%]"
					onClose={() => setOpenArtifactId(null)}
					onOpenArtifact={setOpenArtifactId}
					openArtifactId={openArtifactId}
					snapshot={openArtifactSnapshot}
				/>
			) : null}

			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setOpenArtifactId(null);
					}
				}}
				open={Boolean(openArtifactId && isMobile)}
			>
				<DialogContent
					className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 p-0"
					showCloseButton={false}
				>
					<DialogTitle className="sr-only">
						Artifact workspace
					</DialogTitle>
					<DialogDescription className="sr-only">
						Edit, preview, and compare artifact versions.
					</DialogDescription>
					{openArtifactId ? (
						<ArtifactWorkspace
							chatId={id}
							className="border-l-0"
							onClose={() => setOpenArtifactId(null)}
							onOpenArtifact={setOpenArtifactId}
							openArtifactId={openArtifactId}
							snapshot={openArtifactSnapshot}
						/>
					) : null}
				</DialogContent>
			</Dialog>
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
			if (!queryState) {
				return false;
			}

			const data = queryState.state?.data as Knowledge[] | undefined;
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
