import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import {
	availableModels,
	type ModelDefinition,
	type ModelProvider,
} from "@/lib/ai/models";
import { cloudflare, openrouter } from "@/lib/ai/providers";

export interface RuntimeModel extends ModelDefinition {
	instance: LanguageModel;
}

const createModelInstance = (
	provider: ModelProvider,
	id: string
): LanguageModel => {
	switch (provider) {
		case "google":
			return google.chat(id);
		case "anthropic":
			return anthropic.chat(id);
		case "openai":
			return openai.responses(id);
		case "groq":
			return groq(id);
		case "cloudflare-workers-ai":
			return cloudflare.chat(id);
		case "openrouter":
			return openrouter(id);
		default: {
			const unsupportedProvider: never = provider;
			throw new Error(
				`Unsupported model provider: ${unsupportedProvider}`
			);
		}
	}
};

export const runtimeModels: RuntimeModel[] = availableModels.map((model) => ({
	...model,
	instance: createModelInstance(model.provider, model.id),
}));

export const getRuntimeModel = (modelId: string): RuntimeModel | undefined =>
	runtimeModels.find((model) => model.id === modelId);
