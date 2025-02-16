'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { signOut } from 'next-auth/react';

export default function SignOutBtn() {
    const router = useRouter();

    return (
        <Button
            variant={'destructive'}
            onClick={() => signOut().then(() => router.refresh())}
            className="w-full text-center"
        >
            Sign out
        </Button>
    );
}
