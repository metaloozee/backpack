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
import { ChevronRightIcon, UserRoundIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import SignOutBtn from '@/components/auth/SignOutBtn';
import Image from 'next/image';

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
                        <div className="w-full h-full flex flex-col justify-center items-start">
                            <p>{session.user.name}</p>
                            <p className="text-xs text-muted-foreground break-all truncate overflow-hidden">
                                Professional Tier
                            </p>
                        </div>

                        <ChevronRightIcon className="text-muted-foreground" />
                    </div>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end">
                <SignOutBtn />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
