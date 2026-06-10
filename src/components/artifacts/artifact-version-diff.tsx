"use client";

import { parseDiffFromFile } from "@pierre/diffs";
import { FileDiff } from "@pierre/diffs/react";
import type { ArtifactVersion } from "@/lib/db/schema/app";
import { useIsMobile } from "@/lib/hooks/use-mobile";

interface ArtifactVersionDiffProps {
	fromVersion: ArtifactVersion;
	title: string;
	toVersion: ArtifactVersion;
}

export function ArtifactVersionDiff({
	fromVersion,
	toVersion,
	title,
}: ArtifactVersionDiffProps) {
	const isMobile = useIsMobile();
	const fileDiff = parseDiffFromFile(
		{
			name: `${title}.md`,
			contents: fromVersion.content,
			lang: "markdown",
			cacheKey: `${fromVersion.id}-${title}`,
		},
		{
			name: `${title}.md`,
			contents: toVersion.content,
			lang: "markdown",
			cacheKey: `${toVersion.id}-${title}`,
		}
	);

	return (
		<section
			aria-label="Artifact version diff"
			className="h-full min-h-0 min-w-0 overflow-auto overscroll-contain bg-background"
		>
			<FileDiff
				fileDiff={fileDiff}
				options={{
					diffStyle: isMobile ? "unified" : "split",
					overflow: "wrap",
					theme: {
						dark: "pierre-dark",
						light: "pierre-light",
					},
				}}
			/>
		</section>
	);
}
