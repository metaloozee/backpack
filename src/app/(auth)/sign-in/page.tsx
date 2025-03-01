'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { BackpackIcon } from 'lucide-react';
import Google from 'public/google.svg';
import { Separator } from '@/components/ui/separator';

export default function SignInPage() {
    return (
        <main className="bg-background w-full mx-auto my-4 flex flex-col justify-center items-center gap-7">
            <div className="flex flex-col gap-2 justify-center items-center">
                <div className="bg-zinc-800 size-16 rounded-full flex justify-center items-center">
                    <BackpackIcon className="size-8" />
                </div>

                <h1 className="text-4xl">backpack</h1>
                <p className="text-xs text-muted-foreground">
                    Sign-in to access your Specialized Research Assistant.
                </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 max-w-[20vw] w-full">
                <Button
                    size={'lg'}
                    variant={'default'}
                    disabled
                    onClick={() => signIn('Google', { callbackUrl: '/' })}
                >
                    <Image alt="Login with Google" src={Google} className="size-5" />
                    Continue with Google
                </Button>
                <Button
                    size={'lg'}
                    variant={'secondary'}
                    onClick={() => signIn('github', { callbackUrl: '/' })}
                >
                    <GitHubLogoIcon className="size-10" />
                    Continue with GitHub
                </Button>
            </div>
            <Separator className="max-w-[10vw]" />
            <p className="text-muted-foreground text-xs">
                By continuing, you agree to backpack&apos;s Terms of Service and Privacy Policy.
            </p>
        </main>
    );
}
