import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { normalizeModelId } from "@/lib/ai/models";
import { cookieStorage } from "./cookie-storage";
import { createMcpSlice, type McpSlice } from "./slices/mcp.slice";
import { createModeSlice, type ModeSlice } from "./slices/mode.slice";
import { createModelSlice, type ModelSlice } from "./slices/model.slice";
import { createToolsSlice, type ToolsSlice } from "./slices/tools.slice";

export type BoundStore = ModelSlice & ModeSlice & ToolsSlice & McpSlice;

export const usePrefsStore = create<BoundStore>()(
	devtools(
		persist(
			immer((...a) => ({
				...createModelSlice(...a),
				...createModeSlice(...a),
				...createToolsSlice(...a),
				...createMcpSlice(...a),
			})),
			{
				name: "backpack-prefs",
				storage: createJSONStorage(() => cookieStorage),
				version: 1,
				onRehydrateStorage: () => (state) => {
					if (!state) {
						return;
					}

					state.setModelId(state.modelId);
				},
				partialize: (state) => ({
					modelId: normalizeModelId(state.modelId),
					mode: state.mode,
					selectedAgent: state.selectedAgent,
					tools: state.tools,
					mcpServers: state.mcpServers,
				}),
				migrate: (persisted: unknown, _version) => {
					if (!persisted || typeof persisted !== "object") {
						return persisted as BoundStore;
					}

					const normalizedStore = persisted as Partial<BoundStore>;
					return {
						...normalizedStore,
						modelId: normalizeModelId(
							normalizedStore.modelId ?? DEFAULT_MODEL_ID
						),
					} as BoundStore;
				},
				skipHydration: true,
			}
		),
		{ name: "BackpackPrefsStore" }
	)
);
