import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
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
				partialize: (state) => ({
					modelId: state.modelId,
					mode: state.mode,
					selectedAgent: state.selectedAgent,
					tools: state.tools,
					mcpServers: state.mcpServers,
				}),
				migrate: (persisted: unknown, _version) => {
					return persisted as BoundStore;
				},
				skipHydration: true,
			}
		),
		{ name: "BackpackPrefsStore" }
	)
);
