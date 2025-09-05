/** biome-ignore-all lint/suspicious/noConsole: debug logging needed for development */
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";

const REGEX_SPLIT_WORDS = /\s+/;

const generateChunks = (input: string, wordsPerChunk = 250): string[] => {
	if (!input || typeof input !== "string") {
		return [];
	}
	if (wordsPerChunk <= 0) {
		throw new Error("Words per chunk must be positive");
	}

	const words = input.trim().split(REGEX_SPLIT_WORDS);

	if (words.length === 0) {
		return [];
	}

	const chunks: string[] = [];
	let currentChunk: string[] = [];
	let wordCount = 0;

	for (const word of words) {
		currentChunk.push(word);
		wordCount++;

		if (wordCount === wordsPerChunk) {
			chunks.push(currentChunk.join(" "));
			currentChunk = [];
			wordCount = 0;
		}
	}

	if (currentChunk.length > 0) {
		chunks.push(currentChunk.join(" "));
	}

	return chunks;
};

export const generateEmbeddings = async (value: string): Promise<Array<{ embedding: number[]; content: string }>> => {
	const chunks = generateChunks(value);

	const BATCH_SIZE = 100;
	const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
	const embeddingsResult: Array<{ embedding: number[]; content: string }> = [];

	for (let start = 0, batchIndex = 0; start < chunks.length; start += BATCH_SIZE, batchIndex++) {
		const batch = chunks.slice(start, start + BATCH_SIZE);

		console.log(`🔃 Embedding batch ${batchIndex + 1}/${totalBatches} – processing ${batch.length} chunk(s)`);

		const { embeddings } = await embedMany({
			model: google.textEmbeddingModel("text-embedding-004"),
			values: batch,
		});

		embeddings.forEach((embedding, idx) => {
			embeddingsResult.push({ content: batch[idx], embedding });
		});

		console.log(`✅ Completed batch ${batchIndex + 1}/${totalBatches}`);
	}

	return embeddingsResult;
};
