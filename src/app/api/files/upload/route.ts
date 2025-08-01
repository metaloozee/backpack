import { getSession } from '@/lib/auth/utils';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeFileName } from '@/lib/utils/sanitization';

const FileSchema = z.object({
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, {
            message: 'File size should be less than 5MB.',
        })
        .refine((file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type), {
            message: 'Only JPEG and PNG images are allowed.',
        }),
});

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            throw new Error('Access denied');
        }

        if (request.body === null) {
            throw new Error('Request body is empty');
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new Error('No file uploaded');
        }

        const validatedFile = FileSchema.safeParse({ file });
        if (!validatedFile.success) {
            const errorMessage = validatedFile.error.issues
                .map((issue) => issue.message)
                .join(', ');
            throw new Error(errorMessage);
        }

        const sanitizedFileName = sanitizeFileName(file.name);
        const fileBuffer = await file.arrayBuffer();

        const data = await put(`${session.userId}/chat/${sanitizedFileName}`, fileBuffer, {
            access: 'public',
        });

        return NextResponse.json(data);
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
