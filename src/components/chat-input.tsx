/** biome-ignore-all lint/suspicious/noConsole: debug logging needed for development */
"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { MicIcon, PaperclipIcon, StopCircleIcon } from "lucide-react";
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
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuItem,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputHeader,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { ModeSelector } from "@/components/mode-selector";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import type {
	ChatMessage,
	Attachment as PendingAttachment,
} from "@/lib/ai/types";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

interface InputPanelProps {
	chatId: string;
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	status: UseChatHelpers<ChatMessage>["status"];
	stop: () => void;
	attachments: PendingAttachment[];
	setAttachments: Dispatch<SetStateAction<PendingAttachment[]>>;
	messages: ChatMessage[];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
}

function PureInput({
	chatId,
	input,
	setInput,
	status,
	stop,
	attachments,
	setAttachments,
	messages,
	setMessages,
	sendMessage,
}: InputPanelProps) {
	const greeting = "How can I help you today?";
	const trpc = useTRPC();
	const pathname = usePathname();
	const isSpaceChat = pathname.startsWith("/s/");
	const isLoading = status === "submitted" || status === "streaming";
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

	let recordingIcon: React.ReactNode = <MicIcon className="size-4" />;
	if (isTranscribing) {
		recordingIcon = <Loader variant="secondary" />;
	} else if (isRecording) {
		recordingIcon = <StopCircleIcon className="size-4" />;
	}

	return (
		<div
			className={cn(
				"sticky w-full bg-background",
				messages.length > 0
					? "right-0 bottom-0 left-0"
					: "flex flex-col items-center justify-center"
			)}
		>
			{isDragging ? (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-sm">
					<div className="font-semibold text-2xl text-white">
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

			{messages.length === 0 && !isSpaceChat ? (
				<div className="mb-6">
					<h1 className="bg-linear-to-br from-white to-neutral-500 bg-clip-text text-3xl text-transparent">
						{greeting}
					</h1>
				</div>
			) : null}

			<div className="mx-auto w-full max-w-3xl">
				<PromptInput
					className="mb-2 rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur"
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
										className="flex items-center gap-2 rounded-full border bg-muted/20 px-3 py-2"
										key={`upload-${fileName}`}
									>
										<Loader />
										<span className="max-w-40 truncate text-sm">
											{fileName}
										</span>
									</div>
								))}
							</Attachments>
						</PromptInputHeader>
					) : null}

					<PromptInputBody className="px-4 pt-3 pb-2">
						<PromptInputTextarea
							aria-label="Chat input"
							autoFocus
							className="resize-none! min-h-18 border-0 bg-transparent! px-0 text-[15px] leading-6 focus-visible:ring-0"
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
							value={input}
						/>
					</PromptInputBody>

					<PromptInputFooter className="flex items-center justify-between border-white/5 border-t px-4 py-3">
						<PromptInputTools className="shrink-0 items-center gap-2">
							<ModeSelector />
						</PromptInputTools>

						<div>
							<PromptInputTools className="ml-auto flex shrink-0 items-center gap-2">
								<PromptInputActionMenu>
									<PromptInputActionMenuTrigger aria-label="Open attachment actions" />
									<PromptInputActionMenuContent>
										<PromptInputActionMenuItem
											disabled={status !== "ready"}
											onClick={(event) => {
												event.preventDefault();
												fileInputRef.current?.click();
											}}
										>
											<PaperclipIcon className="size-4" />
											Add attachments
										</PromptInputActionMenuItem>
									</PromptInputActionMenuContent>
								</PromptInputActionMenu>

								<PromptInputButton
									aria-label={recordingLabel}
									disabled={isTranscribing}
									onClick={handleRecord}
									variant={
										isRecording ? "destructive" : "ghost"
									}
								>
									{recordingIcon}
								</PromptInputButton>

								<ModelSelector />

								{isLoading ? (
									<Button
										aria-label="Stop generating"
										onClick={(event) => {
											event.preventDefault();
											stop();
											setMessages(
												(
													currentMessages: ChatMessage[]
												) => currentMessages
											);
										}}
										type="button"
										variant="destructive"
									>
										<StopCircleIcon className="size-4" />
									</Button>
								) : (
									<PromptInputSubmit
										aria-label="Send message"
										className="rounded-md px-3"
										disabled={!input.trim()}
										status={status}
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

export const Input = React.memo(PureInput);

Input.displayName = "Input";
