import { generateText, type LanguageModel } from "ai";
import { MAX_ARTIFACT_CONTENT_LENGTH } from "@/lib/artifacts/types";

export interface RewriteTextArtifactResult {
	content: string;
	summary: string;
}

export const rewriteTextArtifact = async ({
	model,
	currentContent,
	instructions,
	onProgress,
}: {
	model: LanguageModel;
	currentContent: string;
	instructions: string;
	onProgress: (message: string) => void;
}): Promise<RewriteTextArtifactResult> => {
	onProgress("Rewriting the document");

	const { text } = await generateText({
		model,
		system: "You rewrite complete markdown artifacts. Return only the rewritten artifact content. Do not include a preface, summary, or code fence.",
		prompt: `User rewrite instructions:
${instructions}

Current artifact content:
${currentContent}

Return the complete rewritten artifact content.`,
	});

	const content = text.trim();
	if (content.length === 0) {
		throw new Error("Rewrite produced empty artifact content");
	}
	if (content.length > MAX_ARTIFACT_CONTENT_LENGTH) {
		throw new Error("Artifact content is too large to save");
	}

	return {
		content,
		summary: "Rewrote the artifact",
	};
};
