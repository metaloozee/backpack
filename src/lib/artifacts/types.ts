import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";

export const artifactKinds = ["text"] as const;

export const MAX_ARTIFACT_CONTENT_LENGTH = 250_000;

export type ArtifactKind = (typeof artifactKinds)[number];
export type ArtifactVersionSource = ArtifactVersion["source"];

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

export interface ArtifactVersionSummary {
	artifactId: string;
	contentLength: number;
	createdAt: Date;
	id: string;
	messageId: string | null;
	restoredFromVersionId: string | null;
	source: ArtifactVersionSource;
	versionNumber: number;
}

export interface ArtifactWorkspaceData {
	artifact: Artifact;
	latestVersion: ArtifactVersion | null;
	versions: ArtifactVersionSummary[];
}
