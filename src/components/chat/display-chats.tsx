'use client';

import { useCallback, useState } from 'react';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/trpc';
import { type Chat } from '@/lib/db/schema/app';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { motion } from 'motion/react';
import {
    messageVariants,
    buttonVariants,
    fadeVariants,
    iconVariants,
    modalVariants,
    staggerVariants,
    transitions,
} from '@/lib/animations';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2Icon, ChevronsDownIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

import { toast } from 'sonner';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { format } from 'timeago.js';

function ChatCard({ chat, refetch }: { chat: Chat; refetch: () => void }) {
    const trpc = useTRPC();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);

    const mutation = useMutation(trpc.chat.deleteChat.mutationOptions());

    return (
        <motion.div
            key={chat.id}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={transitions.smooth}
            className={cn(
                'relative w-full rounded-lg border border-border/50 bg-neutral-900/50 p-4 transition-colors duration-200 hover:bg-neutral-900/70',
                'flex justify-between items-center'
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <Link
                href={`/c/${chat.id}`}
                className="absolute inset-0"
                aria-label={`Open chat ${chat.title}`}
            >
                <span className="sr-only">Open chat {chat.title}</span>
            </Link>

            <motion.div
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-1 justify-start items-start w-full pointer-events-none relative"
            >
                <p className="max-w-md truncate">{chat.title}</p>

                <p className="text-xs text-muted-foreground truncate max-w-md">
                    Created {format(chat.createdAt)}
                </p>
            </motion.div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <motion.div
                        variants={buttonVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        className="pointer-events-auto relative z-10"
                    >
                        <Button
                            variant={'ghost'}
                            size={'icon'}
                            className="pointer-events-auto relative z-10"
                        >
                            <Trash2Icon className="size-3 text-muted-foreground" />
                        </Button>
                    </motion.div>
                </DialogTrigger>
                <DialogContent>
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <DialogHeader className="space-y-5">
                            <motion.div
                                variants={staggerVariants.container}
                                initial="hidden"
                                animate="visible"
                                className="space-y-2"
                            >
                                <motion.div variants={staggerVariants.item}>
                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                </motion.div>
                                <motion.div variants={staggerVariants.item}>
                                    <DialogDescription className="text-sm">
                                        This action cannot be undone. This will permanently delete
                                        your chat and remove your data from our servers.
                                    </DialogDescription>
                                </motion.div>
                            </motion.div>

                            <motion.div
                                variants={staggerVariants.container}
                                initial="hidden"
                                animate="visible"
                                className="w-full flex flex-row-reverse gap-2"
                            >
                                <motion.div variants={staggerVariants.item}>
                                    <motion.div initial="rest" whileHover="hover" whileTap="tap">
                                        <Button
                                            variant={'destructive'}
                                            disabled={mutation.isPending}
                                            className="text-xs"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                await mutation.mutateAsync({ chatId: chat.id });
                                                refetch();
                                                setIsOpen(false);
                                            }}
                                        >
                                            <motion.div
                                                variants={fadeVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="flex justify-center items-center gap-2 w-full"
                                            >
                                                {mutation.isPending ? (
                                                    <motion.div
                                                        variants={iconVariants}
                                                        initial="rest"
                                                        animate="spin"
                                                    >
                                                        <Loader className="size-3 text-red-400" />
                                                    </motion.div>
                                                ) : (
                                                    <>delete</>
                                                )}
                                            </motion.div>
                                        </Button>
                                    </motion.div>
                                </motion.div>
                                <motion.div variants={staggerVariants.item}>
                                    <motion.div initial="rest" whileHover="hover" whileTap="tap">
                                        <Button
                                            onClick={() => setIsOpen(!isOpen)}
                                            variant={'link'}
                                            className="text-xs"
                                        >
                                            <motion.div
                                                variants={fadeVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="flex justify-center items-center gap-2 w-full"
                                            >
                                                cancel
                                            </motion.div>
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </DialogHeader>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

export default function DisplayChats({ spaceId }: { spaceId?: string }) {
    const trpc = useTRPC();

    const query = useInfiniteQuery(
        trpc.chat.getChats.infiniteQueryOptions(
            {
                limit: spaceId ? 2 : 5,
                spaceId,
            },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
            }
        )
    );
    const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, status } = query;

    const chats = data?.pages.flatMap((page) => page.chats) ?? [];

    if (status === 'pending') {
        return (
            <>
                {Array.from({ length: spaceId ? 1 : 3 }).map((_, index) => (
                    <motion.div
                        key={index}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative w-full rounded-lg border border-border/50 bg-neutral-900/50 p-4 flex justify-between items-center"
                    >
                        <div className="flex flex-col gap-2 justify-start items-start w-full">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </motion.div>
                ))}
            </>
        );
    }

    return (
        <>
            {chats.map((chat) => (
                <ChatCard refetch={query.refetch} key={chat.id} chat={chat} />
            ))}

            {hasNextPage && (
                <motion.div
                    className="w-full flex justify-center items-center"
                    variants={buttonVariants}
                >
                    <Button
                        variant={'ghost'}
                        onClick={() => fetchNextPage()}
                        className="text-sm text-muted-foreground hover:cursor-pointer"
                    >
                        <motion.div
                            variants={fadeVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex justify-center items-center gap-2 w-full text-xs"
                        >
                            {isFetchingNextPage ? (
                                <Loader />
                            ) : (
                                <ChevronsDownIcon className="size-4 text-muted-foreground" />
                            )}
                        </motion.div>
                    </Button>
                </motion.div>
            )}
        </>
    );
}
