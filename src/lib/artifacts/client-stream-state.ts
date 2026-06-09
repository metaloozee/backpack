import type { ArtifactStreamEvent } from "@/lib/artifacts/types";

export const ARTIFACT_STREAM_FLUSH_MS = 100;

export interface ArtifactSnapshot {
	artifactId: string;
	chatId: string;
	content: string;
	kind: "text";
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
	let nextState = state;

	for (const event of events) {
		switch (event.event) {
			case "open": {
				nextState = {
					...nextState,
					openArtifactId: event.artifactId,
					snapshots: {
						...nextState.snapshots,
						[event.artifactId]: {
							artifactId: event.artifactId,
							chatId: event.chatId,
							kind: event.kind,
							title: event.title,
							content: event.content,
							status: event.status,
							versionNumber: event.versionNumber,
						},
					},
				};
				break;
			}
			case "delta": {
				const existing = nextState.snapshots[event.artifactId];
				if (!existing) {
					break;
				}

				nextState = {
					...nextState,
					snapshots: {
						...nextState.snapshots,
						[event.artifactId]: {
							...existing,
							content: `${existing.content}${event.delta}`,
							status: "streaming",
						},
					},
				};
				break;
			}
			case "finish": {
				const existing = nextState.snapshots[event.artifactId];
				if (!existing) {
					break;
				}

				nextState = {
					...nextState,
					snapshots: {
						...nextState.snapshots,
						[event.artifactId]: {
							...existing,
							content: event.content,
							status: "idle",
							versionNumber: event.versionNumber,
						},
					},
				};
				finishedArtifactIds.push(event.artifactId);
				break;
			}
			case "error": {
				errorMessages.push(event.message);
				if (!event.artifactId) {
					break;
				}

				const existing = nextState.snapshots[event.artifactId];
				if (!existing) {
					break;
				}

				nextState = {
					...nextState,
					snapshots: {
						...nextState.snapshots,
						[event.artifactId]: {
							...existing,
							status: "idle",
						},
					},
				};
				break;
			}
			default:
				break;
		}
	}

	return {
		state: nextState,
		finishedArtifactIds,
		errorMessages,
	};
}
