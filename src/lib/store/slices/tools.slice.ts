import type { StateCreator } from "zustand";
import {
	type BuiltInToolId,
	getDefaultToolsState,
	type ToolsState,
} from "@/lib/ai/tool-registry";
import type { BoundStore } from "../store";

export interface ToolsSlice {
	resetTools: () => void;
	setAllTools: (tools: ToolsState) => void;
	setTool: (id: BuiltInToolId, value: boolean) => void;
	tools: ToolsState;
}

export const createToolsSlice: StateCreator<
	BoundStore,
	[["zustand/immer", never], ["zustand/persist", unknown]],
	[],
	ToolsSlice
> = (set) => ({
	tools: getDefaultToolsState(),
	setTool: (id, value) =>
		set((state) => {
			state.tools[id] = value;
		}),
	setAllTools: (tools) =>
		set((state) => {
			state.tools = tools;
		}),
	resetTools: () =>
		set((state) => {
			state.tools = getDefaultToolsState();
		}),
});
