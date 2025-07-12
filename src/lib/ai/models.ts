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
        name: 'Cypher Alpha',
        id: 'openrouter/cypher-alpha:free',
        provider: 'openrouter',
        instance: openrouter('openrouter/cypher-alpha:free'),
        properties: ['stealth', 'experimental'],
    },
    {
        name: 'DeepSeek V3 0324',
        id: 'deepseek/deepseek-chat-v3-0324:free',
        provider: 'openrouter',
        instance: openrouter('deepseek/deepseek-chat-v3-0324:free'),
        properties: ['experimental'],
    },
    // {
    //     name: 'Qwen QwQ',
    //     id: 'qwen/qwq-32b:free',
    //     provider: 'openrouter',
    //     instance: openrouter('qwen/qwq-32b:free'),
    //     properties: ['reasoning', 'experimental'],
    // },
    {
        name: 'GPT 4.1',
        id: 'gpt-4.1-2025-04-14',
        provider: 'openai',
        instance: openai('gpt-4.1-2025-04-14'),
        properties: ['fast'],
    },
    {
        name: 'o4 mini',
        id: 'o4-mini-2025-04-16',
        provider: 'openai',
        instance: openai('o4-mini-2025-04-16'),
        properties: ['quality', 'reasoning', 'fast'],
    },
    {
        name: 'o3',
        id: 'o3-2025-04-16',
        provider: 'openai',
        instance: openai('o3-2025-04-16'),
        properties: ['quality', 'reasoning', 'fast'],
    },
];

export const getModel = (modelId: string) => {
    return models.find((model) => model.id === modelId)?.instance;
};
