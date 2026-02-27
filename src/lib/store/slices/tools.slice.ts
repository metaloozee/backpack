import type { StateCreator } from "zustand";
import { getDefaultToolsState, type ToolsState } from "@/lib/ai/tools";
import type { BoundStore } from "../store";

export interface ToolsSlice {
	tools: ToolsState;
	setTool: (id: string, value: boolean) => void;
	setAllTools: (tools: ToolsState) => void;
	resetTools: () => void;
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
