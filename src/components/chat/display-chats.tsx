'use client';

import { useState } from 'react';

import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
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
import { Trash2Icon, Loader, LoaderCircleIcon, LoaderIcon, ChevronsDownIcon } from 'lucide-react';

import { toast } from 'sonner';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { format } from 'timeago.js';

function ChatCard({ chat }: { chat: Chat }) {
    const trpc = useTRPC();
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
            <Link className="w-full" key={chat.id} href={`/c/${chat.id}`}>
                <motion.div
                    variants={fadeVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-1 justify-start items-start w-full"
                >
                    <p className="max-w-md truncate">{chat.title}</p>

                    <p className="text-xs text-muted-foreground truncate max-w-md">
                        Created {format(chat.createdAt)}
                    </p>
                </motion.div>
            </Link>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <motion.div
                        variants={buttonVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button variant={'destructive'} size={'icon'}>
                            <Trash2Icon className="size-3" />
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
                                    <motion.div
                                        variants={buttonVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <Button
                                            variant={'destructive'}
                                            disabled={mutation.isPending}
                                            className="text-xs"
                                            onClick={async (e) => {
                                                e.preventDefault();

                                                await mutation.mutateAsync({
                                                    chatId: chat.id,
                                                });

                                                toast.success('Successfully deleted the chat.');
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
                                    <motion.div
                                        variants={buttonVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <Button
                                            onClick={() => setIsOpen(!isOpen)}
                                            variant={'secondary'}
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

    return (
        <>
            {chats.map((chat) => (
                <ChatCard key={chat.id} chat={chat} />
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
                                <LoaderIcon className="size-4 text-muted-foreground animate-spin" />
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
