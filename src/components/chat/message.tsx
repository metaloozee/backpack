"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon, PencilLineIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { Markdown } from "@/components/chat/markdown";
import { MessageActions } from "@/components/chat/message-actions";
import { PreviewAttachment } from "@/components/chat/preview-attachment";
import { AcademicSearchTool } from "@/components/chat/tools/academic-search-tool";
import { ExtractTool } from "@/components/chat/tools/extract";
import { FinanceSearchTool } from "@/components/chat/tools/finance-search-tool";
import { KnowledgeSearchTool } from "@/components/chat/tools/knowledge-search-tool";
import { SaveToMemoriesTool } from "@/components/chat/tools/save-to-memories";
import { WebSearchTool } from "@/components/chat/tools/web-search-tool";
import { Button } from "@/components/ui/button";
import { Disclosure, DisclosureTrigger } from "@/components/ui/disclosure";
import { Loader } from "@/components/ui/loader";
import type { ChatMessage } from "@/lib/ai/types";
import { sanitizeText } from "@/lib/ai/utils";
import { transitions } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDataStream } from "../data-stream-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { MessageEditor } from "./message-editor";

type MessageReasoningProps = {
	isLoading: boolean;
	reasoning: string;
};

// Helper function to render extract tool parts
// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
function renderExtractTool(part: any, key: string): ReactNode {
	const { toolCallId, state } = part;

	if (state === "input-available") {
		const { input } = part;
		return <ExtractTool input={input} key={key} toolCallId={toolCallId} />;
	}

	if (state === "output-available") {
		const { output } = part;
		return <ExtractTool key={key} output={output?.results} toolCallId={toolCallId} />;
	}

	return null;
}

// Helper function to render save to memories tool parts
// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
function renderSaveToMemoriesTool(part: any, key: string): ReactNode {
	const { toolCallId, state } = part;

	if (state === "input-available") {
		const { input } = part;
		return <SaveToMemoriesTool input={input} key={key} toolCallId={toolCallId} />;
	}

	if (state === "output-available") {
		const { output } = part;
		return <SaveToMemoriesTool key={key} output={output} toolCallId={toolCallId} />;
	}

	return null;
}

// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
function renderWebSearchTool(part: any, key: string): ReactNode {
	const { toolCallId, state } = part;

	if (state === "input-available") {
		const { input } = part;
		return <WebSearchTool input={input} key={key} toolCallId={toolCallId} />;
	}

	if (state === "output-available") {
		const { output } = part;
		return <WebSearchTool key={key} output={output} toolCallId={toolCallId} />;
	}

	return null;
}

// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
function renderKnowledgeSearchTool(part: any, key: string): ReactNode {
	const { toolCallId, state } = part;

	if (state === "input-available") {
		const { input } = part;
		return <KnowledgeSearchTool input={input} key={key} toolCallId={toolCallId} />;
	}

	if (state === "output-available") {
		const { output } = part;
		return <KnowledgeSearchTool key={key} output={output || undefined} toolCallId={toolCallId} />;
	}

	return null;
}

// Helper function to render academic search tool parts
// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
function renderAcademicSearchTool(part: any, key: string): ReactNode {
	const { toolCallId, state } = part;

	if (state === "input-available") {
		const { input } = part;
		return <AcademicSearchTool input={input} key={key} toolCallId={toolCallId} />;
	}

	if (state === "output-available") {
		const { output } = part;
		return <AcademicSearchTool key={key} output={output?.results} toolCallId={toolCallId} />;
	}

	return null;
}

// Helper function to render finance search tool parts
// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
function renderFinanceSearchTool(part: any, key: string): ReactNode {
	const { toolCallId, state } = part;

	if (state === "input-available") {
		const { input } = part;
		return <FinanceSearchTool input={input} key={key} toolCallId={toolCallId} />;
	}

	if (state === "output-available") {
		const { output } = part;
		return <FinanceSearchTool key={key} output={output || undefined} toolCallId={toolCallId} />;
	}

	return null;
}

function renderTextPart(
	// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
	messagePart: any,
	key: string,
	props: {
		message: ChatMessage;
		mode: "view" | "edit";
		setMode: React.Dispatch<React.SetStateAction<"view" | "edit">>;
		setMessages: UseChatHelpers<ChatMessage>["setMessages"];
		regenerate: UseChatHelpers<ChatMessage>["regenerate"];
		isCopied: boolean;
		setIsCopied: (copied: boolean) => void;
		copyToClipboard: ReturnType<typeof useCopyToClipboard>[1];
	}
): ReactNode {
	const { message, mode, setMode, setMessages, regenerate, isCopied, setIsCopied, copyToClipboard } = props;
	return (
		<div className="w-full" key={key}>
			<AnimatePresence initial={false} mode="wait">
				{mode === "view" ? (
					<motion.div
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0.5, height: 0 }}
						initial={{ opacity: 0.5, height: 0 }}
						key="view"
						style={{ overflow: "hidden" }}
						transition={{
							duration: 0.3,
							ease: "easeInOut",
						}}
					>
						<div
							className={cn("group/message flex w-full flex-row items-center gap-2", {
								"justify-end": message.role === "user",
							})}
						>
							{message.role === "user" && (
								<TooltipProvider delayDuration={200}>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className="rounded opacity-0 transition-all duration-200 ease-in-out group-hover/message:opacity-100"
												data-testid="message-edit-button"
												onClick={() => {
													setMode("edit");
												}}
												size={"icon"}
												variant="ghost"
											>
												<PencilLineIcon className="size-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent sideOffset={10}>Edit Message</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className="rounded opacity-0 transition-all duration-200 ease-in-out group-hover/message:opacity-100"
												data-testid="message-copy-button"
												onClick={async () => {
													const textFromParts = message.parts
														?.filter((textPart) => textPart.type === "text")
														.map((textPart) => textPart.text)
														.join("\n")
														.trim();

													if (!textFromParts) {
														return toast.error("There is no text to copy.");
													}

													await copyToClipboard(textFromParts);
													setIsCopied(true);
												}}
												size={"icon"}
												variant="ghost"
											>
												<AnimatePresence initial={false} mode="wait">
													{isCopied ? (
														<motion.div
															animate={{
																scale: 1,
																opacity: 1,
																rotate: 0,
															}}
															exit={{
																scale: 0,
																opacity: 0,
																rotate: 180,
															}}
															initial={{
																scale: 0,
																opacity: 0,
																rotate: -180,
															}}
															key="check"
															transition={transitions.bouncy}
														>
															<CheckIcon className="size-3" />
														</motion.div>
													) : (
														<motion.div
															animate={{
																scale: 1,
																opacity: 1,
																rotate: 0,
															}}
															exit={{
																scale: 0,
																opacity: 0,
																rotate: 180,
															}}
															initial={{
																scale: 0,
																opacity: 0,
																rotate: -180,
															}}
															key="copy"
															transition={transitions.smooth}
														>
															<CopyIcon className="size-3" />
														</motion.div>
													)}
												</AnimatePresence>
											</Button>
										</TooltipTrigger>
										<TooltipContent sideOffset={10}>
											<p>{isCopied ? "Copied!" : "Copy message"}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
							<div
								className={cn(
									"flex flex-col gap-4",
									{
										"overflow-auto border bg-neutral-900 px-4 py-1 text-primary":
											message.role === "user",
									},
									message.parts.filter((filePart) => filePart.type === "file").length > 0
										? "rounded-b-xl rounded-tl-xl"
										: "rounded-t-xl rounded-bl-xl"
								)}
								data-testid="message-content"
							>
								<Markdown>{sanitizeText(messagePart.text)}</Markdown>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.div
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0.5, height: 0 }}
						initial={{ opacity: 0.5, height: 0 }}
						key="edit"
						style={{ overflow: "hidden" }}
						transition={{
							duration: 0.3,
							ease: "easeInOut",
						}}
					>
						<MessageEditor
							key={message.id}
							message={message}
							regenerate={regenerate}
							setMessages={setMessages}
							setMode={setMode}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function renderMessagePart(
	// biome-ignore lint/suspicious/noExplicitAny: Complex message part types require any
	messagePart: any,
	index: number,
	props: {
		message: ChatMessage;
		isLoading: boolean;
		mode: "view" | "edit";
		setMode: React.Dispatch<React.SetStateAction<"view" | "edit">>;
		setMessages: UseChatHelpers<ChatMessage>["setMessages"];
		regenerate: UseChatHelpers<ChatMessage>["regenerate"];
		isCopied: boolean;
		setIsCopied: (copied: boolean) => void;
		copyToClipboard: ReturnType<typeof useCopyToClipboard>[1];
	}
): ReactNode {
	const { message, isLoading } = props;
	const { type } = messagePart;
	const key = `message-${message.id}-part-${index}`;

	if (type === "reasoning" && messagePart.text?.trim().length > 0) {
		return <MessageReasoning isLoading={isLoading} key={key} reasoning={messagePart.text} />;
	}

	if (type === "text") {
		return renderTextPart(messagePart, key, props);
	}

	if (type === "tool-extract") {
		return renderExtractTool(messagePart, key);
	}

	if (type === "tool-save_to_memories") {
		return renderSaveToMemoriesTool(messagePart, key);
	}

	if (type === "tool-web_search") {
		return renderWebSearchTool(messagePart, key);
	}

	if (type === "tool-knowledge_search") {
		return renderKnowledgeSearchTool(messagePart, key);
	}

	if (type === "tool-academic_search") {
		return renderAcademicSearchTool(messagePart, key);
	}

	if (type === "tool-finance_search") {
		return renderFinanceSearchTool(messagePart, key);
	}

	return null;
}

export function MessageReasoning({ isLoading, reasoning }: MessageReasoningProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Disclosure className="relative rounded-lg text-sm" onOpenChange={setIsExpanded} open={isExpanded}>
			<motion.div
				animate={{
					height: isExpanded ? "auto" : 96,
				}}
				className="relative overflow-hidden"
			>
				<div className="text-neutral-600 dark:text-neutral-400">
					<Markdown>{reasoning}</Markdown>
				</div>
				{!isExpanded && (
					<div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent" />
				)}
			</motion.div>

			<div className="mt-2 flex items-center justify-center gap-2">
				<DisclosureTrigger>
					<Button
						className="dark:!text-neutral-500 !text-neutral-600 overflow-hidden text-xs"
						size={"sm"}
						variant="ghost"
					>
						<AnimatePresence mode="wait">
							<motion.span
								animate={{ y: 0, opacity: 1 }}
								className="flex items-center gap-2"
								exit={{ y: isExpanded ? -15 : 15, opacity: 0 }}
								initial={{ y: isExpanded ? 15 : -15, opacity: 0 }}
								key={isExpanded ? "expanded" : "collapsed"}
								transition={{ duration: 0.15 }}
							>
								{isLoading && <Loader size="sm" />}
								{isExpanded ? (
									<>
										Hide Reasoning
										<ChevronUpIcon className="size-3" />
									</>
								) : (
									<>
										Show Reasoning
										<ChevronDownIcon className="size-3" />
									</>
								)}
							</motion.span>
						</AnimatePresence>
					</Button>
				</DisclosureTrigger>
			</div>
		</Disclosure>
	);
}

export function Message({
	message,
	isLoading,
	setMessages,
	regenerate,
	requiresScrollPadding,
}: {
	message: ChatMessage;
	isLoading: boolean;
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
	requiresScrollPadding: boolean;
}) {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [_, copyToClipboard] = useCopyToClipboard();
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		if (isCopied) {
			const timer = setTimeout(() => {
				setIsCopied(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [isCopied]);

	const attachmentsFromMessage = message.parts.filter((part) => part.type === "file");

	useDataStream();

	return (
		<AnimatePresence>
			<motion.div
				animate={{ y: 0, opacity: 1 }}
				className="mx-auto w-full max-w-3xl px-4"
				data-role={message.role}
				data-testid={`message-${message.id}`}
				initial={{ y: 5, opacity: 0 }}
			>
				<div
					className={cn("flex w-full gap-4", {
						"my-10": message.role === "user",
					})}
				>
					<div
						className={cn("flex w-full flex-col gap-4", {
							"min-h-96": message.role === "assistant" && requiresScrollPadding,
						})}
					>
						{attachmentsFromMessage.length > 0 && (
							<div className="flex flex-row justify-end gap-2" data-testid={"message-attachments"}>
								{attachmentsFromMessage.map((attachment) => (
									<PreviewAttachment
										attachment={{
											name: attachment.filename ?? "file",
											contentType: attachment.mediaType,
											url: attachment.url,
										}}
										key={attachment.url}
									/>
								))}
							</div>
						)}

						{message.parts
							?.map((messagePart, index) =>
								renderMessagePart(messagePart, index, {
									message,
									isLoading,
									mode,
									setMode,
									setMessages,
									regenerate,
									isCopied,
									setIsCopied,
									copyToClipboard,
								})
							)
							.filter(Boolean)}

						<MessageActions isLoading={isLoading} message={message} />
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

export const PreviewMessage = memo(Message, (prevProps, nextProps) => {
	if (!equal(prevProps.isLoading, nextProps.isLoading)) {
		return false;
	}
	if (!equal(prevProps.message.id, nextProps.message.id)) {
		return false;
	}
	if (!equal(prevProps.requiresScrollPadding, nextProps.requiresScrollPadding)) {
		return false;
	}
	if (!equal(prevProps.message.parts, nextProps.message.parts)) {
		return false;
	}

	return true;
});
