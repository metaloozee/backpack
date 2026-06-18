import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import { indexMarkdownSections } from "@/lib/artifacts/markdown-sections";
import {
	applyTextArtifactPatchOperations,
	type TextArtifactPatchOperation,
} from "@/lib/artifacts/text-patches";
import { MAX_ARTIFACT_CONTENT_LENGTH } from "@/lib/artifacts/types";

const KEYWORD_PATTERN = /[a-z0-9]{3,}/g;
const MAX_CANDIDATE_SECTIONS = 6;

const patchOperationSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("replace_section"),
		sectionId: z.string().min(1),
		content: z.string().min(1),
	}),
	z.object({
		type: z.literal("insert_before_section"),
		sectionId: z.string().min(1),
		content: z.string().min(1),
	}),
	z.object({
		type: z.literal("insert_after_section"),
		sectionId: z.string().min(1),
		content: z.string().min(1),
	}),
	z.object({
		type: z.literal("delete_section"),
		sectionId: z.string().min(1),
	}),
	z.object({
		type: z.literal("replace_text"),
		sectionId: z.string().min(1),
		find: z.string().min(1),
		replace: z.string(),
	}),
]);

const editResultSchema = z.object({
	summary: z.string().min(1).max(500),
	operations: z.array(patchOperationSchema).min(1).max(6),
});

export type TargetedArtifactOperation = "update" | "delete";

export interface EditTextArtifactResult {
	content: string;
	summary: string;
}

const extractKeywords = (value: string): Set<string> =>
	new Set(value.toLowerCase().match(KEYWORD_PATTERN) ?? []);

const scoreSection = ({
	instructions,
	headingPath,
	snippet,
}: {
	instructions: string;
	headingPath: string[];
	snippet: string;
}): number => {
	const instructionKeywords = extractKeywords(instructions);
	const targetText = `${headingPath.join(" ")} ${snippet}`.toLowerCase();

	let score = 0;
	for (const keyword of instructionKeywords) {
		if (targetText.includes(keyword)) {
			score++;
		}
	}

	return score;
};

const selectCandidateSections = ({
	content,
	instructions,
}: {
	content: string;
	instructions: string;
}) => {
	const index = indexMarkdownSections(content);
	const candidates = index.sections
		.filter((section) => section.id !== "root")
		.map((section) => ({
			...section,
			score: scoreSection({
				instructions,
				headingPath: section.headingPath,
				snippet: section.snippet,
			}),
		}))
		.toSorted((a, b) => b.score - a.score)
		.slice(0, MAX_CANDIDATE_SECTIONS);

	return {
		index,
		candidates:
			candidates.length > 0 ? candidates : index.sections.slice(0, 1),
	};
};

export const editTextArtifact = async ({
	model,
	currentContent,
	instructions,
	operation,
	onProgress,
}: {
	model: LanguageModel;
	currentContent: string;
	instructions: string;
	operation: TargetedArtifactOperation;
	onProgress: (message: string) => void;
}): Promise<EditTextArtifactResult> => {
	onProgress("Finding the relevant section");
	const { index, candidates } = selectCandidateSections({
		content: currentContent,
		instructions,
	});

	onProgress(operation === "delete" ? "Planning deletion" : "Planning edit");
	const { object } = await generateObject({
		model,
		schemaName: "TextArtifactPatchPlan",
		schemaDescription:
			"A small set of deterministic patch operations against markdown section ids.",
		schema: editResultSchema,
		system: "You edit markdown artifacts by producing targeted patch operations. Do not rewrite the whole document unless the user asks for a whole-document rewrite. Preserve all unrelated sections. Use only provided section ids. For delete requests, prefer delete_section when the user names a section and replace_text when the user names smaller content.",
		prompt: `Operation: ${operation}

User instructions:
${instructions}

Document outline:
${JSON.stringify(index.outline, null, 2)}

Candidate sections:
${JSON.stringify(
	candidates.map((section) => ({
		id: section.id,
		headingPath: section.headingPath,
		content: section.content,
	})),
	null,
	2
)}

Return patch operations only. Do not include unrelated sections in replacement content.`,
	});

	onProgress(
		operation === "delete" ? "Deleting selected content" : "Applying edit"
	);
	const result = applyTextArtifactPatchOperations({
		content: currentContent,
		index,
		operations: object.operations as TextArtifactPatchOperation[],
	});

	if (result.content.length > MAX_ARTIFACT_CONTENT_LENGTH) {
		throw new Error("Artifact content is too large to save");
	}

	return {
		content: result.content,
		summary: object.summary || result.summary,
	};
};
