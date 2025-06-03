'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { UserIcon, LogOutIcon } from 'lucide-react';
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

interface UserProfileProps {
    state: 'expanded' | 'collapsed';
}

export default function UserProfile({ state }: UserProfileProps) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
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
        <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            className={cn(
                'flex items-center gap-2',
                state === 'collapsed' ? 'justify-center' : 'justify-between w-full'
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
                    className="w-8 h-8 rounded-full bg-primary/10 border border-border/50 flex items-center justify-center"
                >
                    <Avatar>
                        <AvatarImage className="rounded-sm" src={session.user?.image || ''} />
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
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {session.user?.email}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {state === 'expanded' && (
                    <motion.div
                        variants={buttonVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut()}
                            title="Sign Out"
                        >
                            <motion.div variants={iconVariants} initial="rest" whileHover="hover">
                                <LogOutIcon className="size-4" />
                            </motion.div>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
