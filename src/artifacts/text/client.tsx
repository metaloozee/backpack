"use client";

import { TextArtifact } from "@/components/artifacts/text-artifact";

export const textArtifact = {
	kind: "text",
	description:
		"A markdown text artifact for drafting and revising documents.",
	component: TextArtifact,
} as const;
