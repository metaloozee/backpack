import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const generateChunks = (input: string, wordsPerChunk: number = 250): string[] => {
    if (!input || typeof input !== 'string') {
        return [];
    }
    if (wordsPerChunk <= 0) {
        throw new Error('Words per chunk must be positive');
    }

    const words = input.trim().split(/\s+/);

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
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
            wordCount = 0;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    return chunks;
};

export const generateEmbeddings = async (
    value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
    const chunks = generateChunks(value);
    const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('text-embedding-004'),
        values: chunks,
    });

    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
