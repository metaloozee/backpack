import Image from 'next/image';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { BackpackIcon } from 'lucide-react';
import Google from 'public/icons/google.svg';
import { Separator } from '@/components/ui/separator';
import { SignInButton } from '@/components/auth/SignInButton';

export default function SignInPage() {
    return (
        <main className="bg-background w-full mx-auto my-4 flex flex-col justify-center items-center gap-7">
            <div className="flex flex-col gap-2 justify-center items-center">
                <div className="bg-neutral-800 size-16 rounded-full flex justify-center items-center">
                    <BackpackIcon className="size-8" />
                </div>

                <h1 className="text-4xl">backpack</h1>
                <p className="text-xs text-muted-foreground">
                    Sign-in to access your Specialized Research Assistant.
                </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 max-w-[20vw] w-full">
                <SignInButton provider="google" disabled>
                    <Image alt="Login with Google" src={Google} className="size-5 invert" />
                    Continue with Google
                </SignInButton>
                <SignInButton provider="github">
                    <GitHubLogoIcon className="size-5" />
                    Continue with GitHub
                </SignInButton>
            </div>
            <Separator className="max-w-[10vw]" />
            <p className="text-muted-foreground text-xs">
                By continuing, you agree to backpack&apos;s Terms of Service and Privacy Policy.
            </p>
        </main>
    );
}
