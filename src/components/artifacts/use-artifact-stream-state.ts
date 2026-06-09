"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ARTIFACT_STREAM_FLUSH_MS,
	type ArtifactSnapshot,
	type ArtifactStreamState,
	createInitialArtifactStreamState,
	reduceArtifactStreamEvents,
} from "@/lib/artifacts/client-stream-state";
import type { ArtifactStreamEvent } from "@/lib/artifacts/types";

interface ArtifactDataPart {
	type: string;
	data?: unknown;
}

export function useArtifactStreamState({
	dataStream,
	chatId,
	onArtifactFinished,
	onArtifactError,
}: {
	dataStream: ArtifactDataPart[];
	chatId: string;
	onArtifactFinished: (artifactId: string) => void;
	onArtifactError: (message: string) => void;
}): {
	openArtifactId: string | null;
	setOpenArtifactId: React.Dispatch<React.SetStateAction<string | null>>;
	openArtifactSnapshot: ArtifactSnapshot | undefined;
} {
	const [streamState, setStreamState] = useState<ArtifactStreamState>(() =>
		createInitialArtifactStreamState()
	);
	const stateRef = useRef(streamState);
	const dataStreamLengthRef = useRef(dataStream.length);
	const pendingDeltaEventsRef = useRef<ArtifactStreamEvent[]>([]);
	const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	dataStreamLengthRef.current = dataStream.length;

	const updateStreamState = useCallback(
		(events: ArtifactStreamEvent[]) => {
			if (events.length === 0) {
				return;
			}

			const result = reduceArtifactStreamEvents({
				state: stateRef.current,
				events,
			});
			stateRef.current = result.state;
			setStreamState(result.state);

			for (const artifactId of result.finishedArtifactIds) {
				onArtifactFinished(artifactId);
			}
			for (const message of result.errorMessages) {
				onArtifactError(message);
			}
		},
		[onArtifactError, onArtifactFinished]
	);

	const flushPendingDeltas = useCallback(() => {
		if (flushTimeoutRef.current) {
			clearTimeout(flushTimeoutRef.current);
			flushTimeoutRef.current = null;
		}

		const events = pendingDeltaEventsRef.current;
		pendingDeltaEventsRef.current = [];
		updateStreamState(events);
	}, [updateStreamState]);

	const scheduleDeltaFlush = useCallback(() => {
		if (flushTimeoutRef.current) {
			return;
		}

		flushTimeoutRef.current = setTimeout(() => {
			flushTimeoutRef.current = null;
			const events = pendingDeltaEventsRef.current;
			pendingDeltaEventsRef.current = [];
			updateStreamState(events);
		}, ARTIFACT_STREAM_FLUSH_MS);
	}, [updateStreamState]);

	const setOpenArtifactId = useCallback<
		React.Dispatch<React.SetStateAction<string | null>>
	>((value) => {
		const nextOpenArtifactId =
			typeof value === "function"
				? value(stateRef.current.openArtifactId)
				: value;
		const nextState = {
			...stateRef.current,
			openArtifactId: nextOpenArtifactId,
		};

		stateRef.current = nextState;
		setStreamState(nextState);
	}, []);

	useEffect(() => {
		const nextState = {
			...createInitialArtifactStreamState(),
			processedDataStreamLength: chatId ? dataStreamLengthRef.current : 0,
		};
		if (flushTimeoutRef.current) {
			clearTimeout(flushTimeoutRef.current);
			flushTimeoutRef.current = null;
		}
		pendingDeltaEventsRef.current = [];
		stateRef.current = nextState;
		setStreamState(nextState);
	}, [chatId]);

	useEffect(() => {
		const startIndex =
			dataStream.length < stateRef.current.processedDataStreamLength
				? 0
				: stateRef.current.processedDataStreamLength;
		const newParts = dataStream.slice(startIndex);
		if (newParts.length === 0) {
			if (
				stateRef.current.processedDataStreamLength !== dataStream.length
			) {
				stateRef.current = {
					...stateRef.current,
					processedDataStreamLength: dataStream.length,
				};
			}
			return;
		}

		stateRef.current = {
			...stateRef.current,
			processedDataStreamLength: dataStream.length,
		};

		for (const part of newParts) {
			if (part.type !== "data-artifact") {
				continue;
			}

			const event = part.data as ArtifactStreamEvent;
			if (event.event === "delta") {
				pendingDeltaEventsRef.current.push(event);
				scheduleDeltaFlush();
				continue;
			}

			flushPendingDeltas();
			updateStreamState([event]);
		}
	}, [dataStream, flushPendingDeltas, scheduleDeltaFlush, updateStreamState]);

	useEffect(
		() => () => {
			flushPendingDeltas();
		},
		[flushPendingDeltas]
	);

	const openArtifactSnapshot = streamState.openArtifactId
		? streamState.snapshots[streamState.openArtifactId]
		: undefined;

	return {
		openArtifactId: streamState.openArtifactId,
		setOpenArtifactId,
		openArtifactSnapshot,
	};
}
