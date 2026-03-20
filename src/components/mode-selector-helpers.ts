import { defaultTools, type ToolsState } from "@/lib/ai/tools";
import { isMcpServerDisabled, type McpStatus } from "@/lib/mcp/status";
import type { ModeType } from "@/lib/store/slices/mode.slice";

export function getMcpServerSubtitle(
	status: McpStatus,
	serverUrl: string
): string {
	const disabled = isMcpServerDisabled(status);
	if (disabled) {
		if (status === "needs_auth") {
			return "Authenticate to connect";
		}
		if (status === "failed") {
			return "Connection failed";
		}
		return "Connection unknown";
	}
	if (status === "degraded") {
		return "Retry recommended";
	}
	return serverUrl;
}

export function getAllToolsDisabled(): ToolsState {
	return Object.fromEntries(
		defaultTools.map((t) => [t.id, false])
	) as ToolsState;
}

export interface ActivePrefsInput {
	hasHydrated: boolean;
	mode: ModeType;
	selectedAgent: string | null;
	tools: ToolsState;
	mcpServers: Record<string, boolean>;
	initialMode?: string;
	initialSelectedAgent?: string;
	initialTools?: ToolsState;
	initialMcpServers?: Record<string, boolean>;
}

export function getActivePrefs(input: ActivePrefsInput): {
	activeMode: ModeType;
	activeSelectedAgent: string | null;
	activeTools: ToolsState;
	activeMcpServers: Record<string, boolean>;
} {
	const {
		hasHydrated,
		mode,
		selectedAgent,
		tools,
		mcpServers,
		initialMode,
		initialSelectedAgent,
		initialTools,
		initialMcpServers,
	} = input;

	let activeMode: ModeType = mode;
	if (!hasHydrated) {
		activeMode = initialMode === "agent" ? "agent" : "ask";
	}

	return {
		activeMode,
		activeSelectedAgent: hasHydrated
			? selectedAgent
			: (initialSelectedAgent ?? selectedAgent),
		activeTools: hasHydrated ? tools : (initialTools ?? tools),
		activeMcpServers: hasHydrated
			? mcpServers
			: (initialMcpServers ?? mcpServers),
	};
}
