import type { StateCreator } from "zustand";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { isAvailableModelId, type ModelId } from "@/lib/ai/models";
import type { BoundStore } from "../store";

export interface ModelSlice {
	modelId: ModelId;
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
			if (isAvailableModelId(id)) {
				state.modelId = id;
			}
		}),
});
