import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";

export const artifactKinds = ["text"] as const;

export type ArtifactKind = (typeof artifactKinds)[number];

export type ArtifactStreamEvent =
	| {
			event: "open";
			artifactId: string;
			chatId: string;
			kind: ArtifactKind;
			title: string;
			versionNumber?: number;
			content: string;
			status: "streaming" | "idle";
	  }
	| {
			event: "delta";
			artifactId: string;
			delta: string;
	  }
	| {
			event: "finish";
			artifactId: string;
			versionId: string;
			versionNumber: number;
			content: string;
	  }
	| {
			event: "error";
			artifactId?: string;
			message: string;
	  };

export interface ArtifactWithVersions {
	artifact: Artifact;
	versions: ArtifactVersion[];
}
