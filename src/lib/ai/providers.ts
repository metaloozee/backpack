import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/lib/env.mjs";

const CF_ACCOUNT_ID = "2e5cce40462386c5f581522c6ad5160c";

export const openrouter = createOpenRouter({});
export const cloudflare = createOpenAI({
	apiKey: env.CLOUDFLARE_API_KEY,
	baseURL: `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/v1`,
});
