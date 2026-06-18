import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";

export type InputModality = "text" | "image" | "audio" | "video" | "pdf";
export type OutputModality = "text" | "image" | "audio";

export interface ModelCapabilities {
	attachment: boolean;
	reasoning: boolean;
	toolCall: boolean;
}

export type ModelProvider =
	| "anthropic"
	| "cloudflare-workers-ai"
	| "google"
	| "groq"
	| "openai"
	| "openrouter";

export interface ModelDefinition {
	capabilities: ModelCapabilities;
	enabledInProduction: boolean;
	id: string;
	modalities: {
		input: readonly InputModality[];
		output: readonly OutputModality[];
	};
	name: string;
	provider: ModelProvider;
}

const isProduction = process.env.NODE_ENV === "production";

export const models = [
	{
		name: "GLM 4.7 Flash",
		id: "@cf/zai-org/glm-4.7-flash",
		provider: "cloudflare-workers-ai",
		enabledInProduction: true,
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
	{
		name: "Gemini 3.1 Pro Preview",
		id: "gemini-3.1-pro-preview",
		provider: "google",
		enabledInProduction: false,
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
		enabledInProduction: true,
		modalities: {
			input: ["text", "image", "audio", "video", "pdf"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Claude Opus 4.8",
		id: "claude-opus-4-8",
		provider: "anthropic",
		enabledInProduction: false,
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
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
	{
		name: "NVIDIA: Nemotron 3 Ultra",
		id: "nvidia/nemotron-3-ultra-550b-a55b:free",
		provider: "openrouter",
		enabledInProduction: true,
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
	{
		name: "NVIDIA: Nemotron 3 Super",
		id: "nvidia/nemotron-3-super-120b-a12b:free",
		provider: "openrouter",
		enabledInProduction: true,
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: false },
	},
	{
		name: "Nex AGI: Nex-N2-Pro",
		id: "nex-agi/nex-n2-pro:free",
		provider: "openrouter",
		enabledInProduction: true,
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: { reasoning: true, toolCall: true, attachment: true },
	},
	{
		name: "Owl Alpha",
		id: "openrouter/owl-alpha",
		provider: "openrouter",
		enabledInProduction: true,
		modalities: {
			input: ["text"],
			output: ["text"],
		},
		capabilities: {
			reasoning: true,
			toolCall: true,
			attachment: false,
		},
	},
	{
		name: "MoonshotAI: Kimi K2.6 (free)",
		id: "moonshotai/kimi-k2.6:free",
		provider: "openrouter",
		enabledInProduction: true,
		modalities: {
			input: ["text", "image"],
			output: ["text"],
		},
		capabilities: {
			reasoning: true,
			toolCall: true,
			attachment: true,
		},
	},
] as const satisfies readonly ModelDefinition[];

export type Model = ModelDefinition;
export type ModelId = (typeof models)[number]["id"];

const defaultModel = models.find((model) => model.id === DEFAULT_MODEL_ID);

if (!defaultModel) {
	throw new Error(`Default model is not configured: ${DEFAULT_MODEL_ID}`);
}

if (!defaultModel.enabledInProduction) {
	throw new Error(
		`Default model must be enabled in production: ${DEFAULT_MODEL_ID}`
	);
}

export const availableModels = models.filter(
	(model) => !isProduction || model.enabledInProduction
);

export const getModel = (modelId: string): ModelDefinition | undefined =>
	availableModels.find((model) => model.id === modelId);

export const isModelId = (modelId: string): modelId is ModelId =>
	models.some((model) => model.id === modelId);

export const isAvailableModelId = (modelId: string): modelId is ModelId =>
	availableModels.some((model) => model.id === modelId);
