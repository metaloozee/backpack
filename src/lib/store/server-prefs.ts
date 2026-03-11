import { cookies } from "next/headers";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { normalizeModelId } from "@/lib/ai/models";
import { getDefaultToolsState, type ToolsState } from "@/lib/ai/tools";
import type { ModeType } from "./slices/mode.slice";

interface ServerPrefs {
	modelId: string;
	mode: ModeType;
	selectedAgent: string | null;
	tools: ToolsState;
	mcpServers: Record<string, boolean>;
}

const DEFAULTS: ServerPrefs = {
	modelId: DEFAULT_MODEL_ID,
	mode: "ask",
	selectedAgent: null,
	tools: getDefaultToolsState(),
	mcpServers: {},
};

export async function getServerPrefs(): Promise<ServerPrefs> {
	const cookieStore = await cookies();
	const raw = cookieStore.get("backpack-prefs")?.value;

	if (!raw) {
		return DEFAULTS;
	}

	try {
		const parsed = JSON.parse(raw);
		const state = parsed?.state ?? {};

		return {
			modelId: normalizeModelId(state.modelId ?? DEFAULTS.modelId),
			mode: state.mode ?? DEFAULTS.mode,
			selectedAgent: state.selectedAgent ?? DEFAULTS.selectedAgent,
			tools: state.tools ?? DEFAULTS.tools,
			mcpServers: state.mcpServers ?? DEFAULTS.mcpServers,
		};
	} catch {
		return DEFAULTS;
	}
}
