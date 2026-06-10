import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { cloudflare, openrouter } from "@/lib/ai/providers";
import {
	type Model as MetadataModel,
	models as metadataModels,
	normalizeModelId,
} from "./model-metadata";

export interface Model extends MetadataModel {
	instance: LanguageModel;
}

export type {
	InputModality,
	ModelCapabilities,
	OutputModality,
} from "./model-metadata";

function createModelInstance(provider: string, id: string): LanguageModel {
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
		default:
			throw new Error(`Unsupported model provider: ${provider}`);
	}
}

export const models: Model[] = metadataModels.map((model) => ({
	...model,
	instance: createModelInstance(model.provider, model.id),
}));

const isProduction = process.env.NODE_ENV === "production";

export const availableModels = models.filter(
	(model) =>
		!isProduction ||
		model.enabledInProduction ||
		model.id === DEFAULT_MODEL_ID
);

export const getModel = (modelId: string) => {
	const normalizedModelId = normalizeModelId(modelId);
	return availableModels.find((model) => model.id === normalizedModelId);
};
export { normalizeModelId };
