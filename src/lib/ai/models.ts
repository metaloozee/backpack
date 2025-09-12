import { anthropic } from "@ai-sdk/anthropic";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { OpenRouterLanguageModel } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export type ModelProperties = "reasoning" | "fast" | "quality" | "experimental" | "stealth" | "lightweight";

export type Model = {
	name: string;
	id: string;
	provider: string;
	instance: LanguageModel | OpenRouterLanguageModel;
	properties?: ModelProperties[];
};

const _googleSafetySettings: GoogleGenerativeAIProviderOptions["safetySettings"] = [
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
		name: "Gemini 2.5 Pro",
		id: "gemini-2.5-pro",
		provider: "google",
		instance: google.chat("gemini-2.5-pro"),
		properties: ["reasoning", "quality", "fast"],
	},
	{
		name: "Gemini 2.5 Flash Thinking",
		id: "gemini-2.5-flash:thinking",
		provider: "google",
		instance: google.chat("gemini-2.5-flash"),
		properties: ["experimental", "reasoning", "fast"],
	},
	{
		name: "Gemini 2.5 Flash",
		id: "gemini-2.5-flash",
		provider: "google",
		instance: google.chat("gemini-2.5-flash"),
		properties: ["experimental", "fast"],
	},
	{
		name: "Claude Sonnet 4 Thinking",
		id: "claude-4-sonnet-20250514:thinking",
		provider: "anthropic",
		instance: anthropic.chat("claude-4-sonnet-20250514"),
		properties: ["reasoning", "quality"],
	},
	{
		name: "Claude Sonnet 4",
		id: "claude-4-sonnet-20250514",
		provider: "anthropic",
		instance: anthropic.chat("claude-4-sonnet-20250514"),
		properties: ["quality"],
	},
	{
		name: "GPT 4.1",
		id: "gpt-4.1",
		provider: "openai",
		instance: openai.responses("gpt-4.1"),
		properties: ["fast"],
	},
	{
		name: "GPT 5",
		id: "gpt-5-2025-08-07",
		provider: "openai",
		instance: openai.responses("gpt-5-2025-08-07"),
		properties: ["quality"],
	},
	{
		name: "GPT 5-mini",
		id: "gpt-5-mini-2025-08-07",
		provider: "openai",
		instance: openai.responses("gpt-5-mini-2025-08-07"),
		properties: ["quality", "fast"],
	},
	{
		name: "Kimi K2",
		id: "moonshotai/kimi-k2-instruct-0905",
		provider: "groq",
		instance: groq("moonshotai/kimi-k2-instruct-0905"),
		properties: ["quality", "fast"],
	},
];

export const getModel = (modelId: string) => {
	return models.find((model) => model.id === modelId);
};
