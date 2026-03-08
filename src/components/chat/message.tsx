"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	CopyIcon,
	RefreshCcwIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import {
	Attachment,
	AttachmentInfo,
	AttachmentPreview,
	Attachments,
} from "@/components/ai-elements/attachments";
import {
	Message as ChatMessageItem,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
	MessageToolbar,
} from "@/components/ai-elements/message";
import {
	chatMarkdownComponents,
	chatMarkdownRehypePlugins,
	chatMarkdownRemarkPlugins,
	Markdown,
} from "@/components/chat/markdown";
import { AcademicSearchTool } from "@/components/chat/tools/academic-search-tool";
import { ExtractTool } from "@/components/chat/tools/extract";
import { FinanceSearchTool } from "@/components/chat/tools/finance-search-tool";
import { KnowledgeSearchTool } from "@/components/chat/tools/knowledge-search-tool";
import {
	McpToolResult,
	type McpToolResultProps,
} from "@/components/chat/tools/mcp-tool-result";
import { SaveToMemoriesTool } from "@/components/chat/tools/save-to-memories";
import { WebSearchTool } from "@/components/chat/tools/web-search-tool";
import { Button } from "@/components/ui/button";
import { Disclosure, DisclosureTrigger } from "@/components/ui/disclosure";
import { Loader } from "@/components/ui/loader";
import type { ChatMessage } from "@/lib/ai/types";
import { getTextFromMessage, sanitizeText } from "@/lib/ai/utils";
import { transitions } from "@/lib/animations";
import { cn } from "@/lib/utils";

type MessagePart = ChatMessage["parts"][number];

const TOOL_PREFIX_REGEX = /^tool-/;

function createToolCallId(part: MessagePart) {
	return "toolCallId" in part && typeof part.toolCallId === "string"
		? part.toolCallId
		: crypto.randomUUID();
}

function getDynamicToolState(partType: string, state: unknown) {
	if (partType === "tool-result") {
		return "output-available";
	}

	if (partType === "tool-error") {
		return "output-error";
	}

	if (typeof state === "string") {
		return state;
	}

	return "input-available";
}

function getNormalizedStaticToolData(part: MessagePart) {
	if (typeof part.type === "string" && part.type.startsWith("tool-")) {
		return {
			type: part.type,
			state: "state" in part ? part.state : undefined,
			input: "input" in part ? part.input : undefined,
			output: "output" in part ? part.output : undefined,
			errorText: "errorText" in part ? part.errorText : undefined,
			toolName: part.type.replace(TOOL_PREFIX_REGEX, ""),
			toolCallId: createToolCallId(part),
		};
	}

	return null;
}

function getNormalizedDynamicToolData(part: MessagePart) {
	const partType = part.type as string;

	if (
		partType === "tool-call" ||
		partType === "tool-result" ||
		partType === "tool-error" ||
		partType === "dynamic-tool"
	) {
		const toolName =
			"toolName" in part && typeof part.toolName === "string"
				? part.toolName
				: "unknown";

		return {
			type: `tool-${toolName}`,
			state:
				"state" in part
					? getDynamicToolState(partType, part.state)
					: getDynamicToolState(partType, undefined),
			input: "input" in part ? part.input : undefined,
			output: "output" in part ? part.output : undefined,
			errorText:
				"errorText" in part && typeof part.errorText === "string"
					? part.errorText
					: undefined,
			toolName,
			toolCallId: createToolCallId(part),
		};
	}

	return null;
}

function getNormalizedToolData(part: MessagePart) {
	return (
		getNormalizedStaticToolData(part) ?? getNormalizedDynamicToolData(part)
	);
}

function parseMcpToolName(toolName: string): {
	serverName: string;
	toolName: string;
} {
	const withoutPrefix = toolName.slice(4);
	const firstUnderscore = withoutPrefix.indexOf("_");

	if (firstUnderscore === -1) {
		return { serverName: withoutPrefix, toolName: "" };
	}

	return {
		serverName: withoutPrefix.slice(0, firstUnderscore),
		toolName: withoutPrefix.slice(firstUnderscore + 1),
	};
}

function renderExtractTool(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	if (tool.state === "output-available") {
		return (
			<ExtractTool
				key={`${tool.toolCallId}-${tool.type}`}
				output={
					tool.output &&
					typeof tool.output === "object" &&
					"results" in tool.output
						? (tool.output.results as ComponentProps<
								typeof ExtractTool
							>["output"])
						: undefined
				}
				toolCallId={tool.toolCallId}
			/>
		);
	}

	return (
		<ExtractTool
			input={tool.input as ComponentProps<typeof ExtractTool>["input"]}
			key={`${tool.toolCallId}-${tool.type}`}
			toolCallId={tool.toolCallId}
		/>
	);
}

function renderSaveToMemoriesTool(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	return (
		<SaveToMemoriesTool
			input={
				tool.state === "output-available"
					? undefined
					: (tool.input as ComponentProps<
							typeof SaveToMemoriesTool
						>["input"])
			}
			key={`${tool.toolCallId}-${tool.type}`}
			output={
				tool.state === "output-available"
					? (tool.output as ComponentProps<
							typeof SaveToMemoriesTool
						>["output"])
					: undefined
			}
			toolCallId={tool.toolCallId}
		/>
	);
}

function renderWebSearchToolPart(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	return (
		<WebSearchTool
			input={
				tool.state === "output-available"
					? undefined
					: (tool.input as ComponentProps<
							typeof WebSearchTool
						>["input"])
			}
			key={`${tool.toolCallId}-${tool.type}`}
			output={
				tool.state === "output-available"
					? (tool.output as ComponentProps<
							typeof WebSearchTool
						>["output"])
					: undefined
			}
			toolCallId={tool.toolCallId}
		/>
	);
}

function renderKnowledgeSearchToolPart(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	return (
		<KnowledgeSearchTool
			input={
				tool.state === "output-available"
					? undefined
					: (tool.input as ComponentProps<
							typeof KnowledgeSearchTool
						>["input"])
			}
			key={`${tool.toolCallId}-${tool.type}`}
			output={
				tool.state === "output-available"
					? (tool.output as ComponentProps<
							typeof KnowledgeSearchTool
						>["output"])
					: undefined
			}
			toolCallId={tool.toolCallId}
		/>
	);
}

function renderAcademicSearchToolPart(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	return (
		<AcademicSearchTool
			input={
				tool.state === "output-available"
					? undefined
					: (tool.input as ComponentProps<
							typeof AcademicSearchTool
						>["input"])
			}
			key={`${tool.toolCallId}-${tool.type}`}
			output={
				tool.state === "output-available" &&
				tool.output &&
				typeof tool.output === "object" &&
				"results" in tool.output
					? (tool.output.results as ComponentProps<
							typeof AcademicSearchTool
						>["output"])
					: undefined
			}
			toolCallId={tool.toolCallId}
		/>
	);
}

function renderFinanceSearchToolPart(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	return (
		<FinanceSearchTool
			input={
				tool.state === "output-available"
					? undefined
					: (tool.input as ComponentProps<
							typeof FinanceSearchTool
						>["input"])
			}
			key={`${tool.toolCallId}-${tool.type}`}
			output={
				tool.state === "output-available"
					? (tool.output as ComponentProps<
							typeof FinanceSearchTool
						>["output"])
					: undefined
			}
			toolCallId={tool.toolCallId}
		/>
	);
}

function renderMcpToolPart(
	tool: NonNullable<ReturnType<typeof getNormalizedToolData>>
) {
	if (!tool.toolName.startsWith("mcp_")) {
		return null;
	}

	const { serverName, toolName } = parseMcpToolName(tool.toolName);
	const isError = tool.state === "output-error";
	const isLoading =
		tool.state === "input-streaming" || tool.state === "input-available";
	let resolvedState = tool.state;

	if (!isLoading && tool.output) {
		resolvedState = "output-available";
	}

	return (
		<McpToolResult
			input={tool.input}
			isError={isError}
			key={`${tool.toolCallId}-${tool.type}`}
			output={
				tool.output ??
				(tool.errorText ? { error: tool.errorText } : undefined)
			}
			serverName={serverName}
			state={resolvedState as McpToolResultProps["state"]}
			toolCallId={tool.toolCallId}
			toolName={toolName}
		/>
	);
}

function MessageReasoning({
	isLoading,
	reasoning,
}: {
	isLoading: boolean;
	reasoning: string;
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Disclosure
			className="relative rounded-lg text-sm"
			onOpenChange={setIsExpanded}
			open={isExpanded}
		>
			<motion.div
				animate={{
					height: isExpanded ? "auto" : 96,
				}}
				className="relative overflow-hidden"
			>
				<div className="text-neutral-600 dark:text-neutral-400">
					<Markdown>{reasoning}</Markdown>
				</div>
				{isExpanded ? null : (
					<div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent" />
				)}
			</motion.div>

			<div className="mt-2 flex items-center justify-center gap-2">
				<DisclosureTrigger>
					<Button
						className="dark:!text-neutral-500 !text-neutral-600 overflow-hidden text-xs"
						size="sm"
						variant="ghost"
					>
						<AnimatePresence mode="wait">
							<motion.span
								animate={{ y: 0, opacity: 1 }}
								className="flex items-center gap-2"
								exit={{ y: isExpanded ? -15 : 15, opacity: 0 }}
								initial={{
									y: isExpanded ? 15 : -15,
									opacity: 0,
								}}
								key={isExpanded ? "expanded" : "collapsed"}
								transition={transitions.fast}
							>
								{isLoading ? <Loader size="sm" /> : null}
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

function renderToolPart(part: MessagePart): ReactNode {
	const tool = getNormalizedToolData(part);

	if (!tool) {
		return null;
	}

	switch (tool.type) {
		case "tool-extract":
			return renderExtractTool(tool);
		case "tool-save_to_memories":
			return renderSaveToMemoriesTool(tool);
		case "tool-web_search":
			return renderWebSearchToolPart(tool);
		case "tool-knowledge_search":
			return renderKnowledgeSearchToolPart(tool);
		case "tool-academic_search":
			return renderAcademicSearchToolPart(tool);
		case "tool-finance_search":
			return renderFinanceSearchToolPart(tool);
		default:
			return renderMcpToolPart(tool);
	}
}

function renderTextPart(
	part: MessagePart,
	message: ChatMessage,
	index: number
) {
	if (part.type !== "text") {
		return null;
	}

	return (
		<MessageResponse
			className={cn(
				message.role !== "user" &&
					"w-full rounded-2xl border border-border/50 bg-background/70 px-4 py-3"
			)}
			components={chatMarkdownComponents}
			key={`${message.id}-text-${index}`}
			rehypePlugins={chatMarkdownRehypePlugins}
			remarkPlugins={chatMarkdownRemarkPlugins}
		>
			{sanitizeText(part.text)}
		</MessageResponse>
	);
}

function renderMessagePart(
	part: MessagePart,
	message: ChatMessage,
	index: number
) {
	if (part.type === "reasoning" || part.type === "file") {
		return null;
	}

	if (part.type === "text") {
		return renderTextPart(part, message, index);
	}

	return renderToolPart(part);
}

function renderAttachments(message: ChatMessage) {
	const fileParts = message.parts.filter((part) => part.type === "file");

	if (fileParts.length === 0) {
		return null;
	}

	return (
		<Attachments
			className={cn(message.role === "user" ? "self-end" : "")}
			variant={message.role === "user" ? "inline" : "grid"}
		>
			{fileParts.map((part, index) => (
				<Attachment
					data={{
						filename: getAttachmentFilename(part, index),
						mediaType: part.mediaType,
						url: part.url,
					}}
					key={`${message.id}-file-${part.url}-${index}`}
					variant={message.role === "user" ? "inline" : "grid"}
				>
					<AttachmentPreview />
					{message.role !== "user" ? (
						<div className="space-y-2 p-3">
							<AttachmentInfo showMediaType={true} />
						</div>
					) : (
						<AttachmentInfo className="pr-2" />
					)}
				</Attachment>
			))}
		</Attachments>
	);
}

function getAttachmentFilename(
	part: Extract<MessagePart, { type: "file" }>,
	index: number
) {
	if (typeof part.filename === "string") {
		return part.filename;
	}

	if ("name" in part && typeof part.name === "string") {
		return part.name;
	}

	return `attachment-${index + 1}`;
}

export function Message({
	message,
	isLoading,
	regenerate,
	isLatestAssistant,
}: {
	message: ChatMessage;
	isLoading: boolean;
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
	requiresScrollPadding: boolean;
	isLatestAssistant: boolean;
}) {
	const [_, copyToClipboard] = useCopyToClipboard();
	const reasoningParts = message.parts.filter(
		(part) => part.type === "reasoning"
	);
	const reasoningText = reasoningParts
		.map((part) => part.text)
		.join("\n\n")
		.trim();
	const hasReasoning = reasoningText.length > 0;
	const textContent = getTextFromMessage(message);

	return (
		<div
			className="message-item w-full"
			data-testid={`message-${message.id}`}
		>
			<ChatMessageItem from={message.role}>
				{renderAttachments(message)}

				<MessageContent>
					{hasReasoning ? (
						<MessageReasoning
							isLoading={
								isLatestAssistant &&
								isLoading &&
								message.parts.at(-1)?.type === "reasoning"
							}
							reasoning={reasoningText}
						/>
					) : null}

					{message.parts.map((part, index) =>
						renderMessagePart(part, message, index)
					)}
				</MessageContent>

				{message.role === "assistant" &&
				isLatestAssistant &&
				!isLoading ? (
					<MessageToolbar>
						<div />
						<MessageActions>
							<MessageAction
								label="Retry"
								onClick={() => regenerate()}
								tooltip="Regenerate response"
							>
								<RefreshCcwIcon className="size-3" />
							</MessageAction>
							<MessageAction
								label="Copy"
								onClick={async () => {
									if (!textContent.trim()) {
										toast.error(
											"There is no text to copy."
										);
										return;
									}

									await copyToClipboard(textContent);
									toast.success("Copied to clipboard");
								}}
								tooltip="Copy message"
							>
								<CopyIcon className="size-3" />
							</MessageAction>
						</MessageActions>
					</MessageToolbar>
				) : null}
			</ChatMessageItem>
		</div>
	);
}
