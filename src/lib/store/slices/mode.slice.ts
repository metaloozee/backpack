import type { StateCreator } from "zustand";
import type { BoundStore } from "../store";

export type ModeType = "ask" | "agent";

export interface ModeSlice {
	mode: ModeType;
	selectedAgent: string | null;
	setMode: (mode: ModeType) => void;
	setSelectedAgent: (agent: string | null) => void;
}

export const createModeSlice: StateCreator<
	BoundStore,
	[["zustand/immer", never], ["zustand/persist", unknown]],
	[],
	ModeSlice
> = (set) => ({
	mode: "ask",
	selectedAgent: null,
	setMode: (mode) =>
		set((state) => {
			state.mode = mode;
			if (mode === "ask") {
				state.selectedAgent = null;
			}
		}),
	setSelectedAgent: (agent) =>
		set((state) => {
			state.selectedAgent = agent;
		}),
});
