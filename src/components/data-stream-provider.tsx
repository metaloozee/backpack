"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { CustomUIDataTypes } from "@/lib/ai/types";

// Disable AI SDK warnings in production
// See: https://ai-sdk.dev/docs/ai-sdk-ui/error-handling#turning-off-warnings
if (process.env.NODE_ENV === "production") {
	globalThis.AI_SDK_LOG_WARNINGS = false;
}

interface DataStreamContextValue {
	dataStream: DataUIPart<CustomUIDataTypes>[];
	setDataStream: React.Dispatch<
		React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
	>;
}

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [dataStream, setDataStream] = useState<
		DataUIPart<CustomUIDataTypes>[]
	>([]);

	const value = useMemo(() => ({ dataStream, setDataStream }), [dataStream]);

	return (
		<DataStreamContext.Provider value={value}>
			{children}
		</DataStreamContext.Provider>
	);
}

export function useDataStream() {
	const context = useContext(DataStreamContext);
	if (!context) {
		throw new Error(
			"useDataStream must be used within a DataStreamProvider"
		);
	}
	return context;
}
