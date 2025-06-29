import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

export const models = [
    {
        name: 'Gemini 2.5 Pro',
        id: 'gemini-2.5-pro',
        provider: 'google',
        instance: google('gemini-2.5-pro'),
    },
    {
        name: 'Gemini 2.5 Flash',
        id: 'gemini-2.5-flash',
        provider: 'google',
        instance: google('gemini-2.5-flash'),
    },
    {
        name: 'Claude Sonnet 4',
        id: 'claude-4-sonnet-20250514',
        provider: 'anthropic',
        instance: anthropic('claude-4-sonnet-20250514'),
    },
];

export const getModel = (modelId: string) => {
    return models.find((model) => model.id === modelId)?.instance;
};
