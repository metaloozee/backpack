/** biome-ignore-all lint/suspicious/noConsole: debug logging needed for development */
"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import type { Session } from "better-auth";
import {
	CornerDownLeftIcon,
	MicIcon,
	PaperclipIcon,
	StopCircleIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import React, {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import {
	Attachment,
	AttachmentInfo,
	AttachmentPreview,
	Attachments,
} from "@/components/ai-elements/attachments";
import {
	PromptInput,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputHeader,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { ModeSelector } from "@/components/mode-selector";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import type { ToolsState } from "@/lib/ai/tools";
import type {
	ChatMessage,
	Attachment as PendingAttachment,
} from "@/lib/ai/types";
import { transitions } from "@/lib/animations";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type ComposerLayout = "stickyFooter" | "inline" | "home";

interface InputPanelProps {
	chatId: string;
	session: Session | null;
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	status: UseChatHelpers<ChatMessage>["status"];
	stop: () => void;
	attachments: PendingAttachment[];
	setAttachments: Dispatch<SetStateAction<PendingAttachment[]>>;
	messages: ChatMessage[];
	sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
	initialModel?: string;
	initialTools?: ToolsState;
	initialMode?: string;
	initialAgent?: string;
	initialMcpServers?: Record<string, boolean>;
	composerLayout?: ComposerLayout;
}

function getInputWrapperClasses({
	composerLayout,
	showGreeting,
	messageCount,
}: {
	composerLayout: ComposerLayout;
	showGreeting: boolean;
	messageCount: number;
}): string {
	const baseClasses = "right-0 left-0";

	if (composerLayout === "home") {
		return showGreeting
			? cn(
					baseClasses,
					"flex flex-1 flex-col items-center justify-center sm:justify-center"
				)
			: cn(baseClasses, "flex flex-col items-center");
	}

	if (composerLayout === "inline") {
		return cn(baseClasses, "mt-6 flex w-full shrink-0 flex-col sm:mt-8");
	}

	if (composerLayout === "stickyFooter" && messageCount === 0) {
		return cn(baseClasses, "flex shrink-0 flex-col items-center");
	}

	return baseClasses;
}

function PureInput({
	chatId,
	session: _session,
	input,
	setInput,
	status,
	stop,
	attachments,
	setAttachments,
	messages,
	sendMessage,
	initialModel,
	initialTools,
	initialMode,
	initialAgent,
	initialMcpServers,
	composerLayout = "stickyFooter",
}: InputPanelProps) {
	const greeting = "How can I help you today?";
	const trpc = useTRPC();
	const pathname = usePathname();
	const isSpaceChat = pathname.startsWith("/s/");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [uploadQueue, setUploadQueue] = useState<string[]>([]);
	const [localStorageInput, setLocalStorageInput] = useLocalStorage(
		"input",
		""
	);
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const transcribe = useMutation(trpc.chat.transcribe.mutationOptions());

	const adjustHeight = useCallback(() => {
		if (!textareaRef.current) {
			return;
		}

		textareaRef.current.style.height = "auto";
		textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
	}, []);

	const resetHeight = useCallback(() => {
		if (!textareaRef.current) {
			return;
		}

		textareaRef.current.style.height = "98px";
	}, []);

	useEffect(() => {
		if (!textareaRef.current) {
			return;
		}

		const domValue = textareaRef.current.value;
		const nextValue = domValue || localStorageInput || "";
		setInput(nextValue);
		adjustHeight();
	}, [adjustHeight, localStorageInput, setInput]);

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const nextValue = event.target.value;
		setInput(nextValue);
		setLocalStorageInput(nextValue);
		adjustHeight();
	};

	const submitForm = useCallback(() => {
		window.history.replaceState({}, "", `/c/${chatId}`);

		if (!input.trim()) {
			return;
		}

		sendMessage({
			role: "user",
			parts: [
				...attachments.map((attachment) => ({
					type: "file" as const,
					url: attachment.url,
					name: attachment.name,
					mediaType: attachment.contentType,
				})),
				{
					type: "text" as const,
					text: input,
				},
			],
		});

		setAttachments([]);
		resetHeight();
		setInput("");
		setLocalStorageInput("");
		textareaRef.current?.focus();
	}, [
		attachments,
		chatId,
		input,
		resetHeight,
		sendMessage,
		setAttachments,
		setInput,
		setLocalStorageInput,
	]);

	const handleFiles = useCallback(
		async (files: File[]) => {
			if (files.length === 0) {
				return;
			}

			const uploadSingleFile = async (file: File) => {
				const formData = new FormData();
				formData.append("file", file);

				try {
					const response = await fetch("/api/files/upload", {
						method: "POST",
						body: formData,
					});

					if (!response.ok) {
						const { error } = await response.json();
						toast.error(error);
						return null;
					}

					const data = await response.json();

					return {
						url: data.url as string,
						name: data.pathname as string,
						contentType: data.contentType as string,
					};
				} catch {
					toast.error("Failed to upload file, please try again!");
					return null;
				}
			};

			setUploadQueue((current) => [
				...current,
				...files.map((file) => file.name),
			]);

			try {
				const uploadedAttachments = (
					await Promise.all(
						files.map((file) => uploadSingleFile(file))
					)
				).filter(Boolean) as PendingAttachment[];

				if (uploadedAttachments.length > 0) {
					toast.success("File uploaded successfully!");
				}

				setAttachments((current) => [
					...current,
					...uploadedAttachments,
				]);
			} finally {
				setUploadQueue([]);
			}
		},
		[setAttachments]
	);

	const cleanupRecorder = useCallback(() => {
		if (!mediaRecorderRef.current?.stream) {
			mediaRecorderRef.current = null;
			setIsRecording(false);
			return;
		}

		for (const track of mediaRecorderRef.current.stream.getTracks()) {
			track.stop();
		}

		mediaRecorderRef.current = null;
		setIsRecording(false);
	}, []);

	const handleRecord = useCallback(async () => {
		if (isRecording && mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			cleanupRecorder();
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;
			setIsRecording(true);

			recorder.addEventListener("dataavailable", async (event) => {
				if (event.data.size === 0) {
					return;
				}

				try {
					setIsTranscribing(true);
					const formData = new FormData();
					formData.append("audio", event.data, "audio.webm");

					const { text } = await transcribe.mutateAsync(formData);

					setInput(text);
					setLocalStorageInput(text);
					setIsTranscribing(false);
					cleanupRecorder();
				} catch {
					setIsTranscribing(false);
					toast.error(
						"Failed to transcribe audio, please try again!"
					);
					cleanupRecorder();
				}
			});

			recorder.addEventListener("stop", () => {
				for (const track of stream.getTracks()) {
					track.stop();
				}
			});

			recorder.start();
		} catch {
			setIsRecording(false);
			console.error("Error recording audio");
			toast.error("Failed to record audio, please try again!");
		}
	}, [
		cleanupRecorder,
		isRecording,
		setInput,
		setLocalStorageInput,
		transcribe,
	]);

	let recordingLabel = "Start voice recording";
	if (isTranscribing) {
		recordingLabel = "Transcribing...";
	} else if (isRecording) {
		recordingLabel = "Stop recording";
	}

	const isLoading = status === "submitted" || status === "streaming";

	let recordingIcon: React.ReactNode = <MicIcon className="size-3.5" />;
	if (isTranscribing) {
		recordingIcon = <Spinner size="sm" />;
	} else if (isRecording) {
		recordingIcon = <StopCircleIcon className="size-3.5" />;
	}

	const showGreeting = messages.length === 0 && !isSpaceChat;

	const isMobile = useIsMobile();

	const inputWrapperClasses = getInputWrapperClasses({
		composerLayout,
		showGreeting,
		messageCount: messages.length,
	});

	const positionClasses =
		composerLayout === "inline" ? "relative" : "sticky bottom-0";

	return (
		<div
			className={cn(
				"w-full bg-background",
				positionClasses,
				inputWrapperClasses
			)}
		>
			{isDragging ? (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm dark:bg-neutral-950/50">
					<div className="font-semibold text-2xl text-foreground dark:text-white">
						Drop files to upload
					</div>
				</div>
			) : null}

			<input
				className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
				multiple
				onChange={async (event) => {
					const files = Array.from(event.target.files ?? []);
					await handleFiles(files);
					event.target.value = "";
				}}
				ref={fileInputRef}
				tabIndex={-1}
				type="file"
			/>

			{showGreeting ? (
				<div
					className={cn(
						"flex items-center justify-center",
						isMobile ? "flex-1" : ""
					)}
				>
					<div className="mb-6">
						<h1 className="bg-linear-to-br from-foreground to-muted-foreground bg-clip-text text-3xl text-transparent dark:from-white dark:to-neutral-500">
							{greeting}
						</h1>
					</div>
				</div>
			) : null}

			<div className="mx-auto w-full max-w-3xl px-0">
				<PromptInput
					className={cn(
						"mb-0 border border-border border-x-0 bg-card shadow-xs sm:mb-2 sm:border-x dark:border-white/10 dark:bg-neutral-900/70",
						isMobile ? "rounded-none" : "rounded-2xl"
					)}
					onDragEnter={(event) => {
						event.preventDefault();
						event.stopPropagation();
						if (event.dataTransfer.items.length > 0) {
							setIsDragging(true);
						}
					}}
					onDragLeave={(event) => {
						event.preventDefault();
						event.stopPropagation();
						if (
							event.currentTarget.contains(
								event.relatedTarget as Node
							)
						) {
							return;
						}
						setIsDragging(false);
					}}
					onDragOver={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					onDrop={async (event) => {
						event.preventDefault();
						event.stopPropagation();
						setIsDragging(false);
						await handleFiles(Array.from(event.dataTransfer.files));
					}}
					onSubmit={(_, event) => {
						event.preventDefault();
						if (status !== "ready") {
							toast.error(
								"Please wait for the model to finish its response!"
							);
							return;
						}
						submitForm();
					}}
				>
					{attachments.length > 0 || uploadQueue.length > 0 ? (
						<PromptInputHeader>
							<Attachments variant="inline">
								{attachments.map((attachment, index) => (
									<Attachment
										data={{
											filename: attachment.name,
											mediaType: attachment.contentType,
											url: attachment.url,
										}}
										key={`${attachment.url}-${index}`}
										onRemove={() => {
											setAttachments((current) =>
												current.filter(
													(_, currentIndex) =>
														currentIndex !== index
												)
											);
										}}
										variant="inline"
									>
										<AttachmentPreview />
										<AttachmentInfo />
									</Attachment>
								))}

								{uploadQueue.map((fileName) => (
									<div
										className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3 py-2 dark:border-white/10 dark:bg-neutral-900/60"
										key={`upload-${fileName}`}
									>
										<Spinner size="sm" />
										<span className="max-w-40 truncate text-sm">
											{fileName}
										</span>
									</div>
								))}
							</Attachments>
						</PromptInputHeader>
					) : null}

					<PromptInputBody className="px-4 py-1">
						<PromptInputTextarea
							aria-label="Chat input"
							autoFocus
							className="resize-none! min-h-fit border-0 bg-transparent! px-0 text-[15px] leading-6 focus-visible:ring-0"
							onChange={handleInput}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" &&
									!event.shiftKey &&
									!event.nativeEvent.isComposing
								) {
									event.preventDefault();
									if (status !== "ready") {
										toast.error(
											"Please wait for the model to finish its response!"
										);
										return;
									}
									submitForm();
								}
							}}
							onPaste={async (event) => {
								const files: File[] = [];

								for (const item of event.clipboardData.items) {
									if (
										item.kind === "file" &&
										item.type.startsWith("image/")
									) {
										const file = item.getAsFile();
										if (file) {
											files.push(file);
										}
									}
								}

								if (files.length === 0) {
									return;
								}

								event.preventDefault();
								await handleFiles(files);
							}}
							placeholder="Ask me anything..."
							ref={textareaRef}
							rows={1}
							value={input}
						/>
					</PromptInputBody>

					<PromptInputFooter className="flex items-center justify-between border-border border-t px-4 py-2 dark:border-white/10">
						<PromptInputTools className="shrink-0 items-center gap-2">
							<ModeSelector
								initialMcpServers={initialMcpServers}
								initialMode={initialMode}
								initialSelectedAgent={initialAgent}
								initialTools={initialTools}
							/>
						</PromptInputTools>

						<div>
							<PromptInputTools className="ml-auto flex shrink-0 items-center gap-2">
								<PromptInputButton
									disabled={status !== "ready"}
									onClick={(event) => {
										event.preventDefault();
										fileInputRef.current?.click();
									}}
									size={"icon"}
									variant={"ghost"}
								>
									<PaperclipIcon className="size-3.5" />
								</PromptInputButton>

								<ModelSelector initialModelId={initialModel} />
								{isLoading ? (
									<Button
										aria-label="Stop generating"
										onClick={(event) => {
											event.preventDefault();
											stop();
										}}
										size={"sm"}
										type="button"
										variant="destructive"
									>
										<StopCircleIcon className="size-4" />
									</Button>
								) : (
									<ComposerActionButton
										handleRecord={handleRecord}
										hasInput={input.trim().length > 0}
										isRecording={isRecording}
										isTranscribing={isTranscribing}
										recordingIcon={recordingIcon}
										recordingLabel={recordingLabel}
									/>
								)}
							</PromptInputTools>
						</div>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}

const actionIconMotion = {
	initial: { opacity: 0, y: 6 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -6 },
};

const ComposerActionButton = React.memo(function ComposerActionButton({
	hasInput,
	handleRecord,
	isRecording,
	isTranscribing,
	recordingIcon,
	recordingLabel,
}: {
	hasInput: boolean;
	handleRecord: () => void;
	isRecording: boolean;
	isTranscribing: boolean;
	recordingIcon: React.ReactNode;
	recordingLabel: string;
}) {
	let recordingState = "idle";
	if (isTranscribing) {
		recordingState = "transcribing";
	} else if (isRecording) {
		recordingState = "recording";
	}

	return (
		<Button
			aria-label={hasInput ? "Send message" : recordingLabel}
			className="overflow-hidden rounded-md px-3"
			disabled={!hasInput && isTranscribing}
			onClick={
				hasInput
					? undefined
					: (event) => {
							event.preventDefault();
							handleRecord();
						}
			}
			size={"sm"}
			type={hasInput ? "submit" : "button"}
			variant="default"
		>
			<AnimatePresence initial={false} mode="wait">
				<motion.span
					animate="animate"
					className="flex items-center justify-center"
					exit="exit"
					initial="initial"
					key={hasInput ? "send" : recordingState}
					transition={transitions.smooth}
					variants={actionIconMotion}
				>
					{hasInput ? (
						<CornerDownLeftIcon className="size-4" />
					) : (
						recordingIcon
					)}
				</motion.span>
			</AnimatePresence>
		</Button>
	);
});

export const Input = React.memo(PureInput);

Input.displayName = "Input";
