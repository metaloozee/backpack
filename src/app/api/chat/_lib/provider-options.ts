import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { Model } from "@/lib/ai/models";

export const getReasoningProviderOptions = (model: Model) => {
	if (!model.capabilities.reasoning) {
		return undefined;
	}

	const isGemini3 = model.id.startsWith("gemini-3");
	const googleThinkingConfig = isGemini3
		? {
				thinkingLevel: "high" as const,
				includeThoughts: true,
			}
		: { thinkingBudget: 8192, includeThoughts: true };

	return {
		anthropic: {
			thinking: {
				type: "enabled",
				budgetTokens: 10_000,
			},
		} satisfies AnthropicProviderOptions,
		google: {
			thinkingConfig: googleThinkingConfig,
		} as GoogleGenerativeAIProviderOptions,
		openai: {
			reasoningEffort: "medium",
			reasoningSummary: "detailed",
		} satisfies OpenAIResponsesProviderOptions,
	};
};
