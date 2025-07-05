'use client';

import { useState, ReactNode, ComponentPropsWithoutRef } from 'react';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SignOutButtonProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick'> & {
    children?: ReactNode;
};

export function SignOutButton({ children, ...props }: SignOutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        setIsLoading(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/sign-in');
                },
            },
        });
    };

    return (
        <Button
            variant={'destructive'}
            {...props}
            disabled={props.disabled || isLoading}
            onClick={handleSignOut}
            className={`relative justify-center ${props.className || ''}`}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            )}
            <div
                className={`flex items-center justify-center transition-opacity ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                }`}
            >
                {children ?? 'Sign out'}
            </div>
        </Button>
    );
}
