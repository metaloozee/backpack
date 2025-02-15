'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignOutBtn() {
    const router = useRouter();
    const handleSignOut = async () => {
        const response = await fetch('/api/sign-out', {
            method: 'POST',
            redirect: 'manual',
        });

        if (response.status === 0) {
            // redirected
            // when using `redirect: "manual"`, response status 0 is returned
            return router.refresh();
        }
    };
    return (
        <Button variant={'destructive'} onClick={handleSignOut} className="w-full text-center">
            Sign out
        </Button>
    );
}
