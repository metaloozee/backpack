'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { LogOutIcon, UserRoundIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import SignOutBtn from '@/components/auth/SignOutBtn';

export default function UserProfile({ state }: { state: 'collapsed' | 'expanded' }) {
    const { data: session } = useSession();
    const [open, setOpen] = React.useState(false);

    if (!session) {
        return;
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger>
                {state === 'collapsed' ? (
                    <Avatar className="cursor-pointer rounded-lg border size-7">
                        <AvatarImage src={session.user.image!} alt={session.user.name!} />
                        <AvatarFallback className="text-xs">
                            <UserRoundIcon className="size-5" />
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-full flex justify-start items-center gap-2">
                        <Avatar className="cursor-pointer rounded-lg border size-9">
                            <AvatarImage src={session.user.image!} alt={session.user.name!} />
                            <AvatarFallback className="text-xs">
                                <UserRoundIcon className="size-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-start items-start">
                            <p>{session.user.name}</p>
                            <p className="text-xs text-muted-foreground break-all truncate overflow-hidden">
                                {session.user.email}
                            </p>
                        </div>
                    </div>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end">
                <DropdownMenuItem className="h-10 w-full flex items-center justify-center text-center cursor-pointer">
                    <SignOutBtn />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
