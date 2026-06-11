import type { ModelCapabilities } from "@/lib/ai/models";
import type { ActiveTool, ToolsState } from "./types";

interface ChatRequestLogPayload {
	debug?: {
		chatId: string;
		connectedMcpToolNames: string[];
		enabledMcpServerIds: string[];
		messageId: string;
		query: string;
		userId: string;
	};
	mode: string;
	model: {
		id: string;
		name: string;
		provider: string;
		capabilities: ModelCapabilities;
	};
	request: {
		inSpace: boolean;
		partCount: number;
		attachmentCount: number;
		queryLength: number;
	};
	selectedAgent: string | null;
	tools: {
		toggles: Required<ToolsState>;
		enabled: ActiveTool[];
		mcp: {
			totalConfiguredServers: number;
			totalConnectedTools: number;
		};
		availableToModelCount: number;
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

const shouldIncludeRawChatRequestLogFields = (): boolean =>
	process.env.NODE_ENV === "development" &&
	process.env.CHAT_REQUEST_RAW_LOGGING === "true";

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
}): ChatRequestLogPayload => ({
	mode,
	selectedAgent,
	model,
	request: {
		inSpace: requestEnv.inSpace,
		partCount: message.parts.length,
		attachmentCount: message.parts.filter((part) => part.type === "file")
			.length,
		queryLength: extractQueryText(message.parts).length,
	},
	tools: {
		toggles: getToolToggleSnapshot(toolsState),
		enabled: activeBuiltInTools,
		mcp: {
			totalConfiguredServers: enabledMcpServerIds.length,
			totalConnectedTools: mcpToolNames.length,
		},
		availableToModelCount: allActiveTools.length,
	},
	...(shouldIncludeRawChatRequestLogFields() && {
		debug: {
			chatId,
			messageId: message.id,
			userId,
			query: extractQueryText(message.parts),
			enabledMcpServerIds,
			connectedMcpToolNames: mcpToolNames,
		},
	}),
});
