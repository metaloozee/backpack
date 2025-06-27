import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        DATABASE_URL: z.string().min(1),

        GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
        OPENROUTER_API_KEY: z.string().min(1).startsWith("sk-"),
        TAVILY_API_KEY: z.string().min(1).startsWith("tvly-"),
        MISTRAL_API_KEY: z.string().min(1),

        REDIS_URL: z.string().url().min(1),
        
        AUTH_SECRET:
            process.env.NODE_ENV === 'production'
                ? z.string().min(1)
                : z.string().min(1).optional(),
        AUTH_URL: z.preprocess(
            // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
            // Since NextAuth.js automatically uses the VERCEL_URL if present.
            (str) => process.env.VERCEL_URL ?? str,
            // VERCEL_URL doesn't include `https` so it cant be validated as a URL
            process.env.VERCEL_URL ? z.string().min(1) : z.string().url()
        ),
        AUTH_GITHUB_ID: z.string().min(1),
        AUTH_GITHUB_SECRET: z.string().min(1),
    },
    client: {
        // NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
    },
    // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
    // runtimeEnv: {
    //   DATABASE_URL: process.env.DATABASE_URL,
    //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    // },
    // For Next.js >= 13.4.4, you only need to destructure client variables:
    experimental__runtimeEnv: process.env
});
