import type { ModelCapabilities } from "@/lib/ai/models";
import type { ActiveTool, ToolsState } from "./types";

interface ChatRequestLogPayload {
	chatId: string;
	messageId: string;
	userId: string;
	mode: string;
	selectedAgent: string | null;
	query: string;
	model: {
		id: string;
		name: string;
		provider: string;
		capabilities: ModelCapabilities;
	};
	request: {
		inSpace: boolean;
		spaceId: string | null;
		partCount: number;
		attachmentCount: number;
	};
	tools: {
		toggles: Required<ToolsState>;
		enabled: ActiveTool[];
		mcp: {
			configuredServerIds: string[];
			connectedToolNames: string[];
			totalConfiguredServers: number;
			totalConnectedTools: number;
		};
		availableToModel: string[];
	};
}

const MAX_QUERY_LENGTH = 500;

type MessagePart = { type: "text"; text: string } | { type: "file" };

const extractQueryText = (parts: MessagePart[]): string => {
	const hasFile = parts.some((part) => part.type === "file");
	const textParts = parts
		.filter(
			(part): part is { type: "text"; text: string } =>
				part.type === "text"
		)
		.map((part) => part.text);

	if (hasFile && textParts.length === 0) {
		return "<Document>";
	}

	const combined = textParts.join(" ");
	return combined.length > MAX_QUERY_LENGTH
		? `${combined.slice(0, MAX_QUERY_LENGTH)}...`
		: combined;
};

const getToolToggleSnapshot = (
	toolsState: ToolsState
): Required<ToolsState> => ({
	webSearch: toolsState.webSearch ?? false,
	knowledgeSearch: toolsState.knowledgeSearch ?? false,
	academicSearch: toolsState.academicSearch ?? false,
	financeSearch: toolsState.financeSearch ?? false,
});

export const logChatRequestMetadata = (payload: ChatRequestLogPayload) => {
	console.log(
		JSON.stringify(
			{
				event: "chat.request.metadata",
				timestamp: new Date().toISOString(),
				...payload,
			},
			null,
			2
		)
	);
};

export const createChatRequestLogPayload = ({
	chatId,
	message,
	userId,
	mode,
	selectedAgent,
	model,
	requestEnv,
	toolsState,
	activeBuiltInTools,
	enabledMcpServerIds,
	mcpToolNames,
	allActiveTools,
}: {
	chatId: string;
	message: {
		id: string;
		parts: MessagePart[];
	};
	userId: string;
	mode: string;
	selectedAgent: string | null;
	model: {
		id: string;
		name: string;
		provider: string;
		capabilities: ModelCapabilities;
	};
	requestEnv: {
		inSpace: boolean;
		spaceId?: string;
	};
	toolsState: ToolsState;
	activeBuiltInTools: ActiveTool[];
	enabledMcpServerIds: string[];
	mcpToolNames: string[];
	allActiveTools: string[];
}): ChatRequestLogPayload => {
	return {
		chatId,
		messageId: message.id,
		userId,
		mode,
		selectedAgent,
		query: extractQueryText(message.parts),
		model,
		request: {
			inSpace: requestEnv.inSpace,
			spaceId: requestEnv.spaceId ?? null,
			partCount: message.parts.length,
			attachmentCount: message.parts.filter(
				(part) => part.type === "file"
			).length,
		},
		tools: {
			toggles: getToolToggleSnapshot(toolsState),
			enabled: activeBuiltInTools,
			mcp: {
				configuredServerIds: enabledMcpServerIds,
				connectedToolNames: mcpToolNames,
				totalConfiguredServers: enabledMcpServerIds.length,
				totalConnectedTools: mcpToolNames.length,
			},
			availableToModel: allActiveTools,
		},
	};
};
