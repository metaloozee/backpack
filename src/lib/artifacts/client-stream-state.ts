import { produce } from "immer";
import type {
	ArtifactOperationKind,
	ArtifactStreamEvent,
	ArtifactStreamPhase,
} from "@/lib/artifacts/types";

export const ARTIFACT_STREAM_FLUSH_MS = 100;

export interface ArtifactSnapshot {
	artifactId: string;
	chatId: string;
	content: string;
	kind: "text";
	operation: ArtifactOperationKind;
	progressMessage?: string;
	progressPhase?: ArtifactStreamPhase;
	status: "idle" | "streaming";
	title: string;
	versionNumber?: number;
}

export interface ArtifactStreamState {
	openArtifactId: string | null;
	processedDataStreamLength: number;
	snapshots: Record<string, ArtifactSnapshot>;
}

export interface ArtifactStreamUpdateResult {
	errorMessages: string[];
	finishedArtifactIds: string[];
	state: ArtifactStreamState;
}

export function createInitialArtifactStreamState(): ArtifactStreamState {
	return {
		openArtifactId: null,
		snapshots: {},
		processedDataStreamLength: 0,
	};
}

export function reduceArtifactStreamEvents({
	state,
	events,
}: {
	state: ArtifactStreamState;
	events: ArtifactStreamEvent[];
}): ArtifactStreamUpdateResult {
	const finishedArtifactIds: string[] = [];
	const errorMessages: string[] = [];

	const nextState = produce(state, (draft) => {
		for (const event of events) {
			switch (event.event) {
				case "open": {
					draft.openArtifactId = event.artifactId;
					draft.snapshots[event.artifactId] = {
						artifactId: event.artifactId,
						chatId: event.chatId,
						kind: event.kind,
						title: event.title,
						content: event.content,
						status: event.status,
						operation: event.operation,
						versionNumber: event.versionNumber,
					};
					break;
				}
				case "delta": {
					const existing = draft.snapshots[event.artifactId];
					if (!existing) {
						break;
					}

					if (existing.operation === "create") {
						existing.content += event.delta;
					}
					existing.status = "streaming";
					break;
				}
				case "progress": {
					const existing = draft.snapshots[event.artifactId];
					if (!existing) {
						break;
					}

					existing.progressPhase = event.phase;
					existing.progressMessage = event.message;
					existing.status = "streaming";
					break;
				}
				case "finish": {
					const existing = draft.snapshots[event.artifactId];
					if (!existing) {
						break;
					}

					existing.content = event.content;
					existing.status = "idle";
					existing.versionNumber = event.versionNumber;
					existing.progressMessage = event.summary;
					finishedArtifactIds.push(event.artifactId);
					break;
				}
				case "error": {
					errorMessages.push(event.message);
					if (!event.artifactId) {
						break;
					}

					const existing = draft.snapshots[event.artifactId];
					if (!existing) {
						break;
					}

					existing.status = "idle";
					break;
				}
				default:
					break;
			}
		}
	});

	return {
		state: nextState,
		finishedArtifactIds,
		errorMessages,
	};
}
