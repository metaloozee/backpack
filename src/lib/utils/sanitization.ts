import { z } from 'zod';

export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

export function sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:(?!image\/(?:png|jpeg|jpg|gif|webp))/gi, '')
        .trim()
        .slice(0, 10000);
}

export function sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') return 'untitled';

    return fileName
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\.\./g, '')
        .replace(/^\.+/, '')
        .trim()
        .slice(0, 255);
}

export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    try {
        const parsedUrl = new URL(url);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return '';
        }

        return parsedUrl.toString();
    } catch {
        return '';
    }
}

export const sanitizedTextSchema = z.string().min(1).max(10000).transform(sanitizeUserInput);

export const sanitizedFileNameSchema = z.string().min(1).max(255).transform(sanitizeFileName);

export const sanitizedUrlSchema = z
    .string()
    .url()
    .transform(sanitizeUrl)
    .refine((url) => url !== '', 'Invalid URL');
