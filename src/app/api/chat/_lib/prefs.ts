import { cookies } from "next/headers";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { normalizeModelId } from "@/lib/ai/models";
import type { UserPrefs } from "./types";

const DEFAULT_PREFS: UserPrefs = {
	modelId: DEFAULT_MODEL_ID,
	mode: "ask",
	selectedAgent: null,
	toolsState: {},
	mcpServersState: {},
};

export const getChatRequestPrefs = async (): Promise<UserPrefs> => {
	const cookieStore = await cookies();
	const raw = cookieStore.get("backpack-prefs")?.value;

	if (!raw) {
		return DEFAULT_PREFS;
	}

	try {
		const parsed = JSON.parse(raw);
		const state = parsed?.state ?? {};

		return {
			modelId: normalizeModelId(state.modelId ?? DEFAULT_PREFS.modelId),
			mode: state.mode ?? DEFAULT_PREFS.mode,
			selectedAgent: state.selectedAgent ?? DEFAULT_PREFS.selectedAgent,
			toolsState: state.tools ?? DEFAULT_PREFS.toolsState,
			mcpServersState: state.mcpServers ?? DEFAULT_PREFS.mcpServersState,
		};
	} catch {
		return DEFAULT_PREFS;
	}
};
