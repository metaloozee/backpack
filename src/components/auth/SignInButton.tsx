'use client';

import { useState, ReactNode, ComponentPropsWithoutRef } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type SignInButtonProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick'> & {
    provider: 'google' | 'github';
    children: ReactNode;
};

export function SignInButton({ provider, children, ...props }: SignInButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        await signIn(provider, { callbackUrl: '/' });
    };

    return (
        <Button
            size={'lg'}
            variant={'secondary'}
            {...props}
            disabled={props.disabled || isLoading}
            onClick={handleSignIn}
            className={`relative justify-center ${props.className || ''}`}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            )}
            <div
                className={`flex items-center gap-2 transition-opacity ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                }`}
            >
                {children}
            </div>
        </Button>
    );
}
