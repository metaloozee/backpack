import { type InferStreamType, streams } from "@trigger.dev/sdk";

export const logStream = streams.define<string>({
	id: "logs",
});

export type LogStreamPart = InferStreamType<typeof logStream>;
