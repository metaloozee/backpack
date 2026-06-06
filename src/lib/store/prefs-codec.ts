import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { normalizeModelId } from "@/lib/ai/models";
import { getDefaultToolsState, type ToolsState } from "@/lib/ai/tool-registry";

export const PREFS_COOKIE_NAME = "backpack-prefs" as const;

export type PrefsMode = "ask" | "agent";

export interface BackpackPrefs {
	modelId: string;
	mode: PrefsMode;
	selectedAgent: string | null;
	tools: ToolsState;
	mcpServers: Record<string, boolean>;
}

type PersistedPrefsState = Partial<{
	modelId: unknown;
	mode: unknown;
	selectedAgent: unknown;
	tools: unknown;
	mcpServers: unknown;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const parseBooleanRecord = (
	value: unknown
): Record<string, boolean> | undefined => {
	if (!isRecord(value)) {
		return undefined;
	}

	const entries = Object.entries(value).filter(
		(entry): entry is [string, boolean] => typeof entry[1] === "boolean"
	);

	return Object.fromEntries(entries);
};

const parseMode = (value: unknown): PrefsMode => {
	return value === "agent" ? "agent" : "ask";
};

const toPrefs = (state: PersistedPrefsState): BackpackPrefs => {
	return {
		modelId: normalizeModelId(
			typeof state.modelId === "string" ? state.modelId : DEFAULT_MODEL_ID
		),
		mode: parseMode(state.mode),
		selectedAgent:
			typeof state.selectedAgent === "string"
				? state.selectedAgent
				: null,
		tools: {
			...getDefaultToolsState(),
			...(parseBooleanRecord(state.tools) ?? {}),
		},
		mcpServers: parseBooleanRecord(state.mcpServers) ?? {},
	};
};

export const getDefaultPrefs = (): BackpackPrefs => {
	return toPrefs({});
};

export const parsePrefsCookie = (
	raw: string | null | undefined
): BackpackPrefs => {
	if (!raw) {
		return getDefaultPrefs();
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		const state =
			isRecord(parsed) && isRecord(parsed.state) ? parsed.state : {};

		return toPrefs(state);
	} catch {
		return getDefaultPrefs();
	}
};

export const serializePrefsState = (prefs: BackpackPrefs) => {
	return {
		modelId: normalizeModelId(prefs.modelId),
		mode: prefs.mode,
		selectedAgent: prefs.selectedAgent,
		tools: prefs.tools,
		mcpServers: prefs.mcpServers,
	};
};

export const migratePersistedPrefs = (persisted: unknown): BackpackPrefs => {
	if (!isRecord(persisted)) {
		return getDefaultPrefs();
	}

	return toPrefs(persisted);
};
