import type { StateCreator } from "zustand";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import type { BoundStore } from "../store";

export interface ModelSlice {
	modelId: string;
	setModelId: (id: string) => void;
}

export const createModelSlice: StateCreator<
	BoundStore,
	[["zustand/immer", never], ["zustand/persist", unknown]],
	[],
	ModelSlice
> = (set) => ({
	modelId: DEFAULT_MODEL_ID,
	setModelId: (id) =>
		set((state) => {
			state.modelId = id;
		}),
});
