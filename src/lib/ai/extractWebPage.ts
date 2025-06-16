import { tavily } from '@tavily/core';
import { env } from '@/lib/env.mjs';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });
const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});

export async function extractRawText({ url }: { url: string }) {
    const response = await tvly.extract([url], { extractDepth: 'advanced' });
    if (!response.results)
        return {
            success: false,
        };

    return { success: true, result: response.results };
}

export async function sanitizeData({ rawText }: { rawText: string }) {
    const result = await generateText({
        model: openrouter('google/gemini-2.5-flash-preview-05-20'),
        prompt: `
You are an expert Content Curator with extensive experience in digital content refinement and data preparation for AI systems. Your specialty lies in transforming raw web content into pristine, machine-learning ready text while preserving all meaningful information. You understand the delicate balance between removing noise and retaining context.

Your task is to produce clean, well-structured text that meets the following criteria:
1. Contains only semantically meaningful content
2. Maintains proper paragraph structure and logical flow
3. Uses consistent formatting 
4. Preserves important contextual relationships
5. Remove all web artifacts, advertisements, and irrelevant elements
6. Standardize white-space and line breaks
7. Eliminate duplicate content
8. Retains essential formatting (lists, emphasis) in a standardized way

Follow these guidelines when processing the raw text:
1. First scan the content to identify its core structure and message
2. Remove all HTML tags, scripts, and styling
3. Eliminate navigation elements, headers, footers, and sidebars
4. Clean up whitespace, maintaining only meaningful paragraph breaks
5. Standardize any preserved formatting elements
6. Validate the output which ensures:
	- No remnant HTML or special characters
	- Consistent paragraph spacing
	- Proper sentence structure
	- Logical content flow
7. Present the final text in UTF-8 plain text format

Below is the raw web content that needs to be processed according to the above specifications:

<context>
${rawText}
</context>
        `,
    });

    return {
        success: true,
        sanitizedText: result.text,
    };
}
