import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';

export const models = [
    {
        name: 'Gemini 2.5 Pro',
        id: 'gemini-2.5-pro',
        provider: 'google',
        instance: google('gemini-2.5-pro'),
        reasoning: true,
    },
    {
        name: 'Gemini 2.5 Flash',
        id: 'gemini-2.5-flash',
        provider: 'google',
        instance: google('gemini-2.5-flash'),
        reasoning: true,
    },
    {
        name: 'Claude Sonnet 4',
        id: 'claude-4-sonnet-20250514',
        provider: 'anthropic',
        instance: anthropic('claude-4-sonnet-20250514'),
        reasoning: true,
    },
    {
        name: 'Qwen QwQ',
        id: 'qwen-qwq-32b',
        provider: 'groq',
        instance: groq('qwen-qwq-32b'),
        reasoning: true,
    },
    // {
    //     name: 'GPT 4.1',
    //     id: 'gpt-4.1-2025-04-14',
    //     provider: 'openai',
    //     instance: openai('gpt-4.1-2025-04-14'),
    //     reasoning: false,
    // },
    // {
    //     name: 'o4 mini',
    //     id: 'o4-mini-2025-04-16',
    //     provider: 'openai',
    //     instance: openai('o4-mini-2025-04-16'),
    //     reasoning: true,
    // },
    // {
    //     name: 'o3',
    //     id: 'o3-2025-04-16',
    //     provider: 'openai',
    //     instance: openai('o3-2025-04-16'),
    //     reasoning: true,
    // }
];

export const getModel = (modelId: string) => {
    return models.find((model) => model.id === modelId)?.instance;
};
