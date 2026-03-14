import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";

const openrouter = createOpenRouter({});

export type InputModality = "text" | "image" | "audio" | "video" | "pdf";
export type OutputModality = "text" | "image" | "audio";

export interface ModelCapabilities {
	reasoning: boolean;
	toolCall: boolean;
	attachment: boolean;
}

export interface Model {
	name: string;
	id: string;
	provider: string;
	enabledInProduction: boolean;
	instance: LanguageModel;
	modalities: {
		input: InputModality[];
		output: OutputModality[];
	};
	capabilities: ModelCapabilities;
}

const legacyModelIdMap = {
	"gemini-3-pro-preview": "gemini-3.1-pro-preview",
	"gemini-3-flash-preview": "gemini-3.1-flash-lite-preview",
	"gemini-2.5-pro": "gemini-3.1-pro-preview",
	"gemini-2.5-flash": "gemini-flash-latest",
	"gemini-2.5-flash-lite": "gemini-3.1-flash-lite-preview",
	"claude-opus-4-5": "claude-opus-4-6",
	"claude-sonnet-4-5": "claude-sonnet-4-6",
	"claude-sonnet-4-20250514": "claude-sonnet-4-6",
	"gpt-5.2": "gpt-5.4-pro",
	"gpt-5.2-codex": "gpt-5.3-codex",
	"gpt-5": "gpt-5.4-pro",
	"gpt-5.4-pro": "gpt-5.4",
	"gpt-5.3-codex": "gpt-5.4",
	"o4-mini": "gpt-5-mini",
} as const satisfies Record<string, string>;

const isProduction = process.env.NODE_ENV === "production";

export const models: Model[] = [
	{
		name: "Gemini 3.1 Pro Preview",
		id: "gemini-3.1-pro-preview",
		provider: "google",
		enabledInProduction: false,
		instance: google.chat("gemini-3.1-pro-preview"),
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Gemini 3.1 Flash Lite Preview",
		id: "gemini-3.1-flash-lite-preview",
		provider: "google",
		enabledInProduction: true,
		instance: google.chat("gemini-3.1-flash-lite-preview"),
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Gemini Flash Latest",
		id: "gemini-flash-latest",
		provider: "google",
		enabledInProduction: false,
		instance: google.chat("gemini-flash-latest"),
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Claude Opus 4.6",
		id: "claude-opus-4-6",
		provider: "anthropic",
		enabledInProduction: false,
		instance: anthropic.chat("claude-opus-4-6"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Claude Sonnet 4.6",
		id: "claude-sonnet-4-6",
		provider: "anthropic",
		enabledInProduction: false,
		instance: anthropic.chat("claude-sonnet-4-6"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Claude Haiku 4.5",
		id: "claude-haiku-4-5",
		provider: "anthropic",
		enabledInProduction: false,
		instance: anthropic.chat("claude-haiku-4-5"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT-5.4",
		id: "gpt-5.4",
		provider: "openai",
		enabledInProduction: false,
		instance: openai.responses("gpt-5.4"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT-5 Mini",
		id: "gpt-5-mini",
		provider: "openai",
		enabledInProduction: false,
		instance: openai.responses("gpt-5-mini"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT-5 Nano",
		id: "gpt-5-nano",
		provider: "openai",
		enabledInProduction: true,
		instance: openai.responses("gpt-5-nano"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT OSS 120B",
		id: "openai/gpt-oss-120b",
		provider: "groq",
		enabledInProduction: true,
		instance: groq("openai/gpt-oss-120b"),
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
	{
		name: "NVIDIA: Nemotron 3 Super",
		id: "nvidia/nemotron-3-super-120b-a12b:free",
		provider: "nvidia",
		instance: openrouter("nvidia/nemotron-3-super-120b-a12b:free"),
		enabledInProduction: true,
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
	{
		name: "Hunter Alpha",
		id: "openrouter/hunter-alpha",
		provider: "openrouter",
		instance: openrouter("openrouter/hunter-alpha"),
		enabledInProduction: true,
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
];

export const availableModels = models.filter(
	(model) =>
		!isProduction ||
		model.enabledInProduction ||
		model.id === DEFAULT_MODEL_ID
);

const getFallbackModel = (): Model | undefined => {
	return (
		availableModels.find((model) => model.id === DEFAULT_MODEL_ID) ??
		availableModels[0]
	);
};

export const normalizeModelId = (modelId: string): string => {
	const normalizedModelId =
		legacyModelIdMap[modelId as keyof typeof legacyModelIdMap] ?? modelId;

	if (availableModels.some((model) => model.id === normalizedModelId)) {
		return normalizedModelId;
	}

	return getFallbackModel()?.id ?? normalizedModelId;
};

export const getModel = (modelId: string) => {
	const normalizedModelId = normalizeModelId(modelId);
	return availableModels.find((model) => model.id === normalizedModelId);
};
