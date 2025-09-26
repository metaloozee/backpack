/** biome-ignore-all lint/suspicious/noConsole: debug logging needed for development */
"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, CornerDownLeftIcon, MicIcon, PaperclipIcon, StopCircleIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { ModeSelector } from "@/components/mode-selector";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import type { ToolsState } from "@/lib/ai/tools";
import type { Attachment, ChatMessage } from "@/lib/ai/types";
import { fadeVariants, layoutTransition, slideVariants, transitions } from "@/lib/animations";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";
import { PreviewAttachment } from "./chat/preview-attachment";

type InputPanelProps = {
	chatId: string;
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	status: UseChatHelpers<ChatMessage>["status"];
	stop: () => void;
	attachments: Attachment[];
	setAttachments: Dispatch<SetStateAction<Attachment[]>>;
	messages: ChatMessage[];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
	tools: ToolsState;
	setTools: Dispatch<SetStateAction<ToolsState>>;
	initialModel?: string;
	initialMode?: string;
	initialAgent?: string;
};

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
	tools,
	setTools,
	initialModel,
	initialMode,
	initialAgent,
}: InputPanelProps) {
	const greeting = "How can I help you today?";
	const trpc = useTRPC();

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const inputContainerRef = useRef<HTMLDivElement>(null);
	const [inputContainerHeight, setInputContainerHeight] = useState(0);
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		const inputEl = inputContainerRef.current;

		if (inputEl) {
			const resizeObserver = new ResizeObserver(() => {
				setInputContainerHeight(inputEl.offsetHeight);
			});
			resizeObserver.observe(inputEl);
			return () => {
				resizeObserver.unobserve(inputEl);
			};
		}
	}, []);

	const adjustHeight = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
		}
	}, []);

	const resetHeight = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = "98px";
		}
	}, []);

	useEffect(() => {
		if (textareaRef.current) {
			adjustHeight();
		}
	}, [adjustHeight]);

	const [localStorageInput, setLocalStorageInput] = useLocalStorage("input", "");

	useEffect(() => {
		if (textareaRef.current) {
			const domValue = textareaRef.current.value;
			const finalValue = domValue || localStorageInput || "";
			setInput(finalValue);
			adjustHeight();
		}
	}, [localStorageInput, setInput, adjustHeight]);

	useEffect(() => {
		setLocalStorageInput(input);
	}, [input, setLocalStorageInput]);

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(event.target.value);
		adjustHeight();
	};

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadQueue, setUploadQueue] = useState<string[]>([]);

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
					type: "text",
					text: input,
				},
			],
		});

		setAttachments([]);
		resetHeight();
		setInput("");
		textareaRef.current?.focus();
	}, [input, setInput, attachments, sendMessage, setAttachments, chatId, resetHeight]);

	const handleFiles = useCallback(
		async (files: File[]) => {
			if (!files || files.length === 0) {
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

					if (response.ok) {
						const data = await response.json();
						const { url, pathname: fileName, contentType } = data;

						toast.success("File uploaded successfully!");

						return {
							url,
							name: fileName,
							contentType,
						};
					}
					const { error } = await response.json();
					toast.error(error);
				} catch {
					toast.error("Failed to upload file, please try again!");
				}
			};

			setUploadQueue((prev) => [...prev, ...files.map((file) => file.name)]);

			try {
				const uploadPromises = files.map((file) => uploadSingleFile(file));
				const uploadedAttachments = (await Promise.all(uploadPromises)).filter(Boolean) as Attachment[];

				setAttachments((currentAttachments) => [...currentAttachments, ...uploadedAttachments]);
			} catch (error) {
				console.error("Error uploading files!", error);
				toast.error("Failed to upload files, please try again!");
			} finally {
				setUploadQueue([]);
			}
		},
		[setAttachments]
	);

	const handleFileChange = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files || []);
			await handleFiles(files);

			if (event.target) {
				event.target.value = "";
			}
		},
		[handleFiles]
	);

	const handleDrop = useCallback(
		async (event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setIsDragging(false);

			const files = Array.from(event.dataTransfer.files);
			if (files.length > 0) {
				await handleFiles(files);
			}
		},
		[handleFiles]
	);

	const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		if (event.currentTarget.contains(event.relatedTarget as Node)) {
			return;
		}
		setIsDragging(false);
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const handlePaste = useCallback(
		async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
			const items = event.clipboardData.items;
			const files: File[] = [];
			for (const item of items) {
				if (item.kind === "file" && item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) {
						files.push(file);
					}
				}
			}

			if (files.length > 0) {
				event.preventDefault();
				await handleFiles(files);
				// toast.success(`${files.length} image(s) pasted and uploading.`);
			}
		},
		[handleFiles]
	);

	const pathname = usePathname();
	const isSpaceChat = pathname.startsWith("/s/");

	const isLoading = status === "submitted" || status === "streaming";

	const { isAtBottom, scrollToBottom } = useScrollToBottom();

	useEffect(() => {
		if (status === "submitted") {
			scrollToBottom();
		}
	}, [status, scrollToBottom]);

	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);

	const transcribe = useMutation(trpc.chat.transcribe.mutationOptions());

	const cleanupRecorder = useCallback(() => {
		if (mediaRecorderRef.current?.stream) {
			for (const track of mediaRecorderRef.current.stream.getTracks()) {
				track.stop();
			}
		}
		mediaRecorderRef.current = null;
		setIsRecording(false);
	}, []);

	const handleRecord = useCallback(async () => {
		setIsRecording(true);

		if (isRecording && mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			cleanupRecorder();
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const recorder = new MediaRecorder(stream);
				mediaRecorderRef.current = recorder;

				recorder.addEventListener("dataavailable", async (event) => {
					if (event.data.size > 0) {
						const audioBlob = event.data;

						try {
							setIsTranscribing(true);
							const formData = new FormData();
							formData.append("audio", audioBlob, "audio.webm");

							const { text } = await transcribe.mutateAsync(formData);

							setInput(text);
							setIsTranscribing(false);
							setIsRecording(false);
						} catch {
							setIsTranscribing(false);
							toast.error("Failed to transcribe audio, please try again!");
						} finally {
							cleanupRecorder();
						}
					}
				});

				recorder.addEventListener("stop", () => {
					for (const track of stream.getTracks()) {
						track.stop();
					}
				});

				recorder.start();
				setIsRecording(true);
			} catch {
				setIsRecording(false);
				console.error("Error recording audio");
				toast.error("Failed to record audio, please try again!");
			}
		}
	}, [isRecording, transcribe.mutateAsync, setInput, cleanupRecorder]);

	return (
		<motion.div
			className={cn(
				"sticky w-full bg-background",
				messages.length > 0 ? "right-0 bottom-0 left-0" : "flex flex-col items-center justify-center"
			)}
			layout
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			transition={layoutTransition}
		>
			<AnimatePresence>
				{isDragging && (
					<motion.div
						animate={{ opacity: 1 }}
						className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-sm"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
					>
						<div className="font-semibold text-2xl text-white">Drop files to upload</div>
					</motion.div>
				)}
			</AnimatePresence>
			<input
				className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
				multiple
				onChange={handleFileChange}
				ref={fileInputRef}
				tabIndex={-1}
				type="file"
			/>

			<AnimatePresence>
				{messages.length === 0 && !isSpaceChat && (
					<motion.div
						animate="visible"
						className="mb-6"
						exit="exit"
						initial="hidden"
						variants={slideVariants.down}
					>
						<h1 className="bg-linear-to-br from-white to-neutral-500 bg-clip-text text-3xl text-transparent">
							{greeting}
						</h1>
					</motion.div>
				)}
				{messages.length > 0 && !isAtBottom && (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="-translate-x-1/2 absolute left-1/2 rounded-full bg-background/40 backdrop-blur-md"
						exit={{ opacity: 0, y: 10 }}
						initial={{ opacity: 0, y: 10 }}
						style={{ bottom: `${inputContainerHeight + 16}px` }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					>
						<Button
							className="!bg-transparent rounded-full border"
							data-testid="scroll-to-bottom-button"
							onClick={(event) => {
								event.preventDefault();
								scrollToBottom();
							}}
							size={"sm"}
							variant="secondary"
						>
							<p className="font-normal text-xs">Scroll to bottom</p>
							<ChevronDownIcon className="size-3" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>

			<div className={cn("mx-auto w-full max-w-3xl")} ref={inputContainerRef}>
				{(attachments.length > 0 || uploadQueue.length > 0) && (
					<div className="mx-6 rounded-t-md border border-b-0 bg-neutral-900/50 p-2">
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-row flex-nowrap items-end justify-start gap-2 overflow-x-auto"
							data-testid="attachments-preview"
							exit={{ opacity: 0, y: 10 }}
							initial={{ opacity: 0, y: 10 }}
							transition={{ delay: 0.2 }}
						>
							{attachments.map((attachment, index) => (
								<PreviewAttachment
									attachment={attachment}
									key={attachment.url || `${attachment.name}-${index}`}
									onRemove={() => {
										setAttachments((current) => current.filter((_, i) => i !== index));
									}}
									showName={false}
								/>
							))}
							{uploadQueue.map((fileName, idx) => (
								<PreviewAttachment
									attachment={{
										url: "",
										name: fileName,
										contentType: "",
									}}
									isUploading={true}
									key={`${fileName}-${idx}`}
									showName={true}
								/>
							))}
						</motion.div>
					</div>
				)}
				<div
					className={cn(
						"relative mb-2 flex w-full flex-col rounded-lg border bg-neutral-900/50 p-4 transition-all duration-200 focus-within:border-neutral-700/70 hover:border-neutral-700/70"
					)}
				>
					<Textarea
						autoFocus
						className="!bg-transparent w-full resize-none border-0 text-sm ring-0 placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
						onChange={handleInput}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
								event.preventDefault();

								if (status !== "ready") {
									toast.error("Please wait for the model to finish its response!");
								} else {
									submitForm();
								}
							}
						}}
						onPaste={handlePaste}
						placeholder="Ask me anything..."
						ref={textareaRef}
						spellCheck={true}
						tabIndex={0}
						value={input}
					/>

					<div className="flex w-full items-center justify-between">
						<ModeSelector
							initialAgent={initialAgent}
							initialMode={initialMode}
							setTools={setTools}
							tools={tools}
						/>

						<motion.div
							animate="visible"
							initial="hidden"
							transition={transitions.smooth}
							variants={fadeVariants}
						>
							<AnimatePresence>
								<div className="flex items-center gap-2">
									<AttachmentButton fileInputRef={fileInputRef} status={status} />

									<motion.div className="flex-shrink-0" variants={fadeVariants}>
										<ModelSelector initialModel={initialModel} />
									</motion.div>

									{isLoading ? (
										<StopButton setMessages={setMessages} stop={stop} />
									) : (
										<SendButton
											handleRecord={handleRecord}
											input={input}
											isRecording={isRecording}
											isTranscribing={isTranscribing}
											submitForm={submitForm}
										/>
									)}
								</div>
							</AnimatePresence>
						</motion.div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

const AttachmentButton = React.memo(
	({
		fileInputRef,
		status,
	}: {
		fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
		status: UseChatHelpers<ChatMessage>["status"];
	}) => (
		<Button
			className="flex-shrink-0"
			disabled={status !== "ready"}
			onClick={(event) => {
				event.preventDefault();
				fileInputRef.current?.click();
			}}
			variant={"ghost"}
		>
			<PaperclipIcon className="size-3 text-muted-foreground" />
		</Button>
	)
);

AttachmentButton.displayName = "AttachmentButton";

const StopButton = React.memo(
	({ stop, setMessages }: { stop: () => void; setMessages: UseChatHelpers<ChatMessage>["setMessages"] }) => (
		<Button
			onClick={(event) => {
				event.preventDefault();
				stop();
				setMessages((messages: ChatMessage[]) => messages);
			}}
			variant={"destructive"}
		>
			<motion.div
				animate="visible"
				exit="exit"
				initial="hidden"
				transition={transitions.smooth}
				variants={slideVariants.up}
			>
				<StopCircleIcon />
			</motion.div>
		</Button>
	)
);

StopButton.displayName = "StopButton";

const SendButton = React.memo(
	({
		input,
		submitForm,
		handleRecord,
		isRecording,
		isTranscribing,
	}: {
		input: string;
		submitForm: () => void;
		handleRecord: () => void;
		isRecording: boolean;
		isTranscribing: boolean;
	}) => (
		<motion.div
			animate="visible"
			exit="exit"
			initial="hidden"
			transition={transitions.smooth}
			variants={fadeVariants}
		>
			{input.trim().length <= 0 ? (
				<Button
					className="px-4"
					disabled={isTranscribing}
					onClick={handleRecord}
					variant={isRecording ? "destructive" : "default"}
				>
					<motion.div
						animate="visible"
						exit="exit"
						initial="hidden"
						transition={transitions.smooth}
						variants={slideVariants.up}
					>
						<AnimatePresence mode="wait">
							{(() => {
								if (isTranscribing) {
									return (
										<motion.div
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -5 }}
											initial={{ opacity: 0, y: 5 }}
											key="transcribing-icon"
											transition={transitions.smooth}
										>
											<Loader variant={"secondary"} />
										</motion.div>
									);
								}
								if (isRecording) {
									return (
										<motion.div
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -5 }}
											initial={{ opacity: 0, y: 5 }}
											key="stop-recording-icon"
											transition={transitions.smooth}
										>
											<StopCircleIcon />
										</motion.div>
									);
								}
								return (
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -5 }}
										initial={{ opacity: 0, y: 5 }}
										key="audio-icon"
										transition={transitions.smooth}
									>
										<MicIcon />
									</motion.div>
								);
							})()}
						</AnimatePresence>
					</motion.div>
				</Button>
			) : (
				<Button
					className="px-4"
					onClick={(event) => {
						event.preventDefault();
						submitForm();
					}}
				>
					<motion.div
						animate="visible"
						exit="exit"
						initial="hidden"
						transition={transitions.smooth}
						variants={slideVariants.up}
					>
						<AnimatePresence mode="wait">
							{input.trim().length > 0 ? (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -5 }}
									initial={{ opacity: 0, y: 5 }}
									key="send-icon"
									transition={transitions.smooth}
								>
									<CornerDownLeftIcon />
								</motion.div>
							) : (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -5 }}
									initial={{ opacity: 0, y: 5 }}
									key="send-icon-fallback"
									transition={transitions.smooth}
								>
									<CornerDownLeftIcon />
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</Button>
			)}
		</motion.div>
	)
);

SendButton.displayName = "SendButton";

export const Input = React.memo(PureInput, (prevProps, nextProps) => {
	const prevToolsStr = JSON.stringify(prevProps.tools);
	const nextToolsStr = JSON.stringify(nextProps.tools);

	// Create a lightweight signature of attachments to detect changes
	const attachmentSignature = (attachments: Attachment[]) =>
		attachments.map((a) => `${a.url}|${a.name}|${a.contentType}`).join(",");

	const prevAttachmentsSig = attachmentSignature(prevProps.attachments);
	const nextAttachmentsSig = attachmentSignature(nextProps.attachments);

	if (prevProps.status !== nextProps.status) {
		return false;
	}
	if (prevProps.messages.length !== nextProps.messages.length) {
		return false;
	}
	if (prevProps.input !== nextProps.input) {
		return false;
	}
	if (prevAttachmentsSig !== nextAttachmentsSig) {
		return false;
	}
	if (prevToolsStr !== nextToolsStr) {
		console.log("Tools changed in memo:", prevProps.tools, "→", nextProps.tools);
		return false;
	}

	return true;
});

Input.displayName = "Input";
