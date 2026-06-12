import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type ActiveRun = {
	runId: string;
	publicAccessToken: string;
};

export interface KnowledgeRunsState {
	addRun: (knowledgeId: string, run: ActiveRun) => void;
	removeRun: (knowledgeId: string) => void;
	runs: Record<string, ActiveRun>;
}

export const useKnowledgeRunsStore = create<KnowledgeRunsState>()(
	devtools(
		(set) => ({
			runs: {},
			addRun: (knowledgeId, run) =>
				set(
					(state) => ({
						runs: {
							...state.runs,
							[knowledgeId]: run,
						},
					}),
					false,
					"addRun"
				),
			removeRun: (knowledgeId) =>
				set(
					(state) => {
						const { [knowledgeId]: _, ...remainingRuns } =
							state.runs;
						return { runs: remainingRuns };
					},
					false,
					"removeRun"
				),
		}),
		{ name: "KnowledgeRunsStore" }
	)
);
