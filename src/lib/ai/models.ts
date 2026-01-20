import { anthropic } from "@ai-sdk/anthropic";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { OpenRouterLanguageModel } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

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
	instance: LanguageModel | OpenRouterLanguageModel;
	modalities: {
		input: InputModality[];
		output: OutputModality[];
	};
	capabilities: ModelCapabilities;
}

const _googleSafetySettings: GoogleGenerativeAIProviderOptions["safetySettings"] =
	[
		{
			category: "HARM_CATEGORY_HATE_SPEECH",
			threshold: "BLOCK_NONE",
		},
		{
			category: "HARM_CATEGORY_DANGEROUS_CONTENT",
			threshold: "BLOCK_NONE",
		},
		{
			category: "HARM_CATEGORY_HARASSMENT",
			threshold: "BLOCK_NONE",
		},
		{
			category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
			threshold: "BLOCK_NONE",
		},
		{
			category: "HARM_CATEGORY_CIVIC_INTEGRITY",
			threshold: "BLOCK_NONE",
		},
	];

export const models: Model[] = [
	{
		name: "Gemini 3 Pro Preview",
		id: "gemini-3-pro-preview",
		provider: "google",
		instance: google.chat("gemini-3-pro-preview"),
		modalities: {
			input: ["text", "image", "video", "audio", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Gemini 3 Flash Preview",
		id: "gemini-3-flash-preview",
		provider: "google",
		instance: google.chat("gemini-3-flash-preview"),
		modalities: {
			input: ["text", "image", "video", "audio", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Gemini 2.5 Pro",
		id: "gemini-2.5-pro",
		provider: "google",
		instance: google.chat("gemini-2.5-pro"),
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Gemini 2.5 Flash",
		id: "gemini-2.5-flash",
		provider: "google",
		instance: google.chat("gemini-2.5-flash"),
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Gemini 2.5 Flash Lite",
		id: "gemini-2.5-flash-lite",
		provider: "google",
		instance: google.chat("gemini-2.5-flash-lite"),
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},

	{
		name: "Claude Opus 4.5",
		id: "claude-opus-4-5",
		provider: "anthropic",
		instance: anthropic.chat("claude-opus-4-5"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Claude Sonnet 4.5",
		id: "claude-sonnet-4-5",
		provider: "anthropic",
		instance: anthropic.chat("claude-sonnet-4-5"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Claude Sonnet 4",
		id: "claude-sonnet-4-20250514",
		provider: "anthropic",
		instance: anthropic.chat("claude-sonnet-4-20250514"),
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
		instance: anthropic.chat("claude-haiku-4-5"),
		modalities: {
			input: ["text", "image", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},

	{
		name: "GPT-5.2",
		id: "gpt-5.2",
		provider: "openai",
		instance: openai.responses("gpt-5.2"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT-5.2 Codex",
		id: "gpt-5.2-codex",
		provider: "openai",
		instance: openai.responses("gpt-5.2-codex"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT-5",
		id: "gpt-5",
		provider: "openai",
		instance: openai.responses("gpt-5"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "GPT-5 Mini",
		id: "gpt-5-mini",
		provider: "openai",
		instance: openai.responses("gpt-5-mini"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "o4-mini",
		id: "o4-mini",
		provider: "openai",
		instance: openai.responses("o4-mini"),
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},

	{
		name: "Kimi K2",
		id: "moonshotai/kimi-k2-instruct-0905",
		provider: "groq",
		instance: groq("moonshotai/kimi-k2-instruct-0905"),
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: false, toolCall: true, attachment: false },
	},
];

export const getModel = (modelId: string) => {
	return models.find((model) => model.id === modelId);
};
