import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { type LanguageModelV1 } from 'ai';
import { mistral } from '@ai-sdk/mistral';

export type ModelProperties = 'reasoning' | 'fast' | 'quality' | 'experimental' | 'stealth';

export type Model = {
    name: string;
    id: string;
    provider: string;
    instance: LanguageModelV1;
    properties?: ModelProperties[];
};

const googleSafetySettings: any = [
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
        threshold: 'BLOCK_NONE',
    },
];

export const models: Model[] = [
    {
        name: 'Gemini 2.5 Pro',
        id: 'gemini-2.5-pro',
        provider: 'google',
        instance: google('gemini-2.5-pro'),
        properties: ['reasoning', 'quality', 'fast'],
    },
    {
        name: 'Gemini 2.5 Flash',
        id: 'gemini-2.5-flash',
        provider: 'google',
        instance: google('gemini-2.5-flash'),
        properties: ['experimental', 'reasoning', 'fast'],
    },
    {
        name: 'Claude Sonnet 4',
        id: 'claude-4-sonnet-20250514',
        provider: 'anthropic',
        instance: anthropic('claude-4-sonnet-20250514'),
        properties: ['reasoning', 'quality'],
    },
    {
        name: 'GPT 4.1',
        id: 'gpt-4.1-2025-04-14',
        provider: 'openai',
        instance: openai('gpt-4.1-2025-04-14'),
        properties: ['fast'],
    },
    {
        name: 'Kimi K2',
        id: 'moonshotai/kimi-k2-instruct',
        provider: 'groq',
        instance: groq('moonshotai/kimi-k2-instruct'),
        properties: ['quality', 'fast'],
    },
];

export const getModel = (modelId: string) => {
    return models.find((model) => model.id === modelId)?.instance;
};
