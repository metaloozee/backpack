import type { LanguageModel, UIMessageStreamWriter } from "ai";
import { smoothStream, streamText } from "ai";
import type { ChatMessage } from "@/lib/ai/types";
import type { ArtifactStreamEvent } from "@/lib/artifacts/types";

const TEXT_ARTIFACT_SYSTEM_PROMPT = `
You create high-quality markdown documents for a persistent workspace.

Rules:
- Return only the artifact document content.
- Use markdown structure when it improves readability.
- Do not include chatty prefaces or summaries.
- Do not wrap the whole document in a code fence.
`;

export const streamTextArtifact = async ({
	model,
	prompt,
	onDelta,
}: {
	model: LanguageModel;
	prompt: string;
	onDelta: (delta: string) => void;
}): Promise<string> => {
	let draftContent = "";

	const { fullStream } = streamText({
		model,
		system: TEXT_ARTIFACT_SYSTEM_PROMPT,
		prompt,
		experimental_transform: smoothStream({
			chunking: "word",
			delayInMs: 10,
		}),
	});

	for await (const delta of fullStream) {
		if (delta.type === "text-delta") {
			draftContent += delta.text;
			onDelta(delta.text);
		}
	}

	return draftContent;
};

export const createTextArtifactPrompt = ({
	title,
	instructions,
}: {
	title: string;
	instructions: string;
}): string => `Create a markdown text artifact titled "${title}".

User instructions:
${instructions}`;

export const writeArtifactData = (
	dataStream: UIMessageStreamWriter<ChatMessage>,
	data: ArtifactStreamEvent
) => {
	dataStream.write({
		type: "data-artifact",
		data,
	});
};
