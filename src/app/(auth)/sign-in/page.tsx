'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { GitHubLogoIcon } from '@radix-ui/react-icons';

export default function SignInPage() {
    return (
        <main className="bg-background w-full mx-auto my-4 flex flex-col justify-center items-center gap-5">
            <h1 className="text-4xl">Welcome to backpack</h1>
            <Button
                size={'lg'}
                variant={'secondary'}
                onClick={() => signIn('github', { callbackUrl: '/' })}
            >
                <GitHubLogoIcon className="size-10" />
                Continue with GitHub
            </Button>
            <p className="text-muted-foreground text-xs">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </main>
    );
}
