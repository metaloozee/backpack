import { streamTextArtifact } from "@/artifacts/text/server";

export const artifactHandlersByKind = {
	text: {
		stream: streamTextArtifact,
	},
} as const;

export const artifactKinds = ["text"] as const;
