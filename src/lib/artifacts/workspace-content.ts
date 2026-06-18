import type { ArtifactSnapshot } from "@/lib/artifacts/client-stream-state";

export interface SelectArtifactWorkspaceContentInput {
	draftContent: string | null;
	latestVersionContent?: string;
	latestVersionNumber?: number;
	openArtifactId: string;
	snapshot?: ArtifactSnapshot;
}

export const selectArtifactWorkspaceContent = ({
	draftContent,
	latestVersionContent,
	latestVersionNumber,
	openArtifactId,
	snapshot,
}: SelectArtifactWorkspaceContentInput): string => {
	if (draftContent !== null) {
		return draftContent;
	}

	const isCurrentSnapshot = snapshot?.artifactId === openArtifactId;
	if (!isCurrentSnapshot) {
		return latestVersionContent ?? "";
	}

	if (snapshot.status === "streaming") {
		return snapshot.content;
	}

	const snapshotIsNewerThanLatest =
		typeof snapshot.versionNumber === "number" &&
		(typeof latestVersionNumber !== "number" ||
			snapshot.versionNumber > latestVersionNumber);

	return snapshotIsNewerThanLatest
		? snapshot.content
		: (latestVersionContent ?? snapshot.content);
};
