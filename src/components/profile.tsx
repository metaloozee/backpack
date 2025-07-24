'use client';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
    fadeVariants,
    buttonVariants,
    iconVariants,
    slideVariants,
    transitions,
} from '@/lib/animations';
import { Avatar } from '@radix-ui/react-avatar';
import { AvatarFallback, AvatarImage } from './ui/avatar';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfileProps {
    state: 'expanded' | 'collapsed';
}

export default function UserProfile({ state }: UserProfileProps) {
    const { data: session, isPending, error, refetch } = authClient.useSession();
    const router = useRouter();

    const handleAccountSettings = () => {
        router.push('/account');
    };

    const handleSignOut = () => {
        authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/sign-in');
                },
            },
        });
    };

    if (isPending) {
        return (
            <motion.div
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                    'flex items-center gap-2',
                    state === 'collapsed' ? 'justify-center' : 'justify-start w-full'
                )}
            >
                <motion.div
                    variants={iconVariants}
                    initial="rest"
                    animate="pulse"
                    className="w-8 h-8 bg-muted rounded-full"
                />
                {state === 'expanded' && (
                    <motion.div
                        variants={slideVariants.right}
                        initial="hidden"
                        animate="visible"
                        className="h-4 bg-muted rounded w-20"
                    />
                )}
            </motion.div>
        );
    }

    if (!session) {
        return (
            <motion.div
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={cn(state === 'collapsed' ? 'w-9' : 'w-full')}
            >
                <Button
                    variant="outline"
                    size={state === 'collapsed' ? 'icon' : 'default'}
                    className={cn(state === 'expanded' ? 'w-full' : '')}
                    onClick={() => router.push('/sign-in')}
                >
                    <motion.div variants={iconVariants} initial="rest" whileHover="hover">
                        <UserIcon className="size-4" />
                    </motion.div>
                    <AnimatePresence>
                        {state === 'expanded' && (
                            <motion.span
                                variants={fadeVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={transitions.fast}
                                className="text-sm"
                            >
                                Sign In
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <motion.div
                    variants={fadeVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                        'flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md p-1 transition-colors',
                        state === 'collapsed' ? 'justify-center' : 'justify-start w-full'
                    )}
                >
                    <motion.div
                        variants={slideVariants.right}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center gap-2"
                    >
                        <motion.div
                            variants={iconVariants}
                            initial="rest"
                            whileHover="hover"
                            className="size-8 rounded-full bg-primary/10 border border-border/50 flex items-center justify-center"
                        >
                            <Avatar>
                                <AvatarImage
                                    className="rounded-sm"
                                    src={session.user?.image || ''}
                                />
                                <AvatarFallback>
                                    <UserIcon className="size-4 text-primary" />
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>
                        <AnimatePresence>
                            {state === 'expanded' && (
                                <motion.div
                                    variants={fadeVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={transitions.fast}
                                    className="flex flex-col"
                                >
                                    <span className="text-sm font-medium truncate max-w-[120px]">
                                        {session.user?.name || 'User'}
                                    </span>
                                    <span className="text-xs font-medium truncate max-w-[120px] text-muted-foreground">
                                        {session.user?.email || 'User'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    asChild
                    onClick={handleAccountSettings}
                    className="cursor-pointer"
                >
                    <Button variant="ghost" className="p-0 w-full justify-start">
                        <SettingsIcon className="size-4" />
                        Account Settings
                    </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer" asChild>
                    <Button variant="ghost" className="p-0 w-full justify-start">
                        <LogOutIcon className="size-4" />
                        Sign Out
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
