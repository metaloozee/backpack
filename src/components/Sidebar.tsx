'use client';

import * as React from 'react';
import {
    BackpackIcon,
    GithubIcon,
    InfoIcon,
    LibraryIcon,
    MessagesSquareIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
    SearchIcon,
    TwitterIcon,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import UserProfile from '@/components/profile';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import {
    fadeVariants,
    slideVariants,
    buttonVariants,
    iconVariants,
    transitions,
} from '@/lib/animations';

export function AppSidebar() {
    const pathname = usePathname();

    const isHome = pathname === '/';
    const isSpaces = pathname.startsWith('/s');
    const isChats = pathname.startsWith('/c');

    const { state, open, setOpen } = useSidebar();

    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader
                className={cn(
                    'flex justify-center py-4 w-full',
                    state == 'expanded' ? 'px-4 items-start' : 'px-2 items-center'
                )}
            >
                <AnimatePresence mode="wait">
                    {state === 'expanded' ? (
                        <Link href={'/'} className="w-full">
                            <motion.div
                                key="expanded"
                                variants={fadeVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={transitions.smooth}
                                className="w-full flex justify-center items-center gap-2"
                            >
                                <motion.div
                                    variants={iconVariants}
                                    initial="rest"
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    <BackpackIcon className="size-4" />
                                </motion.div>
                                <h2 className="text-lg font-light">backpack</h2>
                            </motion.div>
                        </Link>
                    ) : (
                        <Link href={'/'}>
                            <motion.div
                                key="collapsed"
                                variants={fadeVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={transitions.smooth}
                            >
                                <motion.div
                                    variants={iconVariants}
                                    initial="rest"
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    <BackpackIcon className="size-4" />
                                </motion.div>
                            </motion.div>
                        </Link>
                    )}
                </AnimatePresence>
            </SidebarHeader>
            <SidebarContent>
                <motion.div
                    className={cn(
                        'h-full w-full flex flex-col justify-center items-center gap-2',
                        state === 'expanded' ? 'px-4' : ''
                    )}
                    variants={slideVariants.left}
                    initial="hidden"
                    animate="visible"
                    transition={transitions.smooth}
                >
                    <motion.div
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        className={cn(state === 'expanded' ? 'w-full' : '')}
                    >
                        <Button
                            asChild
                            className={cn(state === 'expanded' ? 'w-full' : '')}
                            variant={isHome ? 'default' : state === 'expanded' ? 'ghost' : 'ghost'}
                            size={state === 'expanded' ? 'default' : 'icon'}
                        >
                            <Link href={'/'}>
                                {state === 'expanded' ? (
                                    <>
                                        <motion.div
                                            variants={iconVariants}
                                            initial="rest"
                                            whileHover="hover"
                                        >
                                            <SearchIcon />
                                        </motion.div>
                                        <p className="font-light">Search</p>
                                    </>
                                ) : (
                                    <motion.div
                                        variants={iconVariants}
                                        initial="rest"
                                        whileHover="hover"
                                    >
                                        <SearchIcon />
                                    </motion.div>
                                )}
                            </Link>
                        </Button>
                    </motion.div>

                    <motion.div
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        className={cn(state === 'expanded' ? 'w-full' : '')}
                    >
                        <Button
                            asChild
                            className={cn(state === 'expanded' ? 'w-full' : '')}
                            variant={
                                isSpaces ? 'default' : state === 'expanded' ? 'ghost' : 'ghost'
                            }
                            size={state === 'expanded' ? 'default' : 'icon'}
                        >
                            <Link href={'/s/'}>
                                {state === 'expanded' ? (
                                    <>
                                        <motion.div
                                            variants={iconVariants}
                                            initial="rest"
                                            whileHover="hover"
                                        >
                                            <LibraryIcon />
                                        </motion.div>
                                        <p className="font-light">Spaces</p>
                                    </>
                                ) : (
                                    <motion.div
                                        variants={iconVariants}
                                        initial="rest"
                                        whileHover="hover"
                                    >
                                        <LibraryIcon />
                                    </motion.div>
                                )}
                            </Link>
                        </Button>
                    </motion.div>

                    <motion.div
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        className={cn(state === 'expanded' ? 'w-full' : '')}
                    >
                        <Button
                            asChild
                            className={cn(state === 'expanded' ? 'w-full' : '')}
                            variant={isChats ? 'default' : state === 'expanded' ? 'ghost' : 'ghost'}
                            size={state === 'expanded' ? 'default' : 'icon'}
                        >
                            <Link href={'/c/'}>
                                {state === 'expanded' ? (
                                    <>
                                        <motion.div
                                            variants={iconVariants}
                                            initial="rest"
                                            whileHover="hover"
                                        >
                                            <MessagesSquareIcon />
                                        </motion.div>
                                        <p className="font-light">Chats</p>
                                    </>
                                ) : (
                                    <motion.div
                                        variants={iconVariants}
                                        initial="rest"
                                        whileHover="hover"
                                    >
                                        <MessagesSquareIcon />
                                    </motion.div>
                                )}
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>
            </SidebarContent>
            <SidebarFooter
                className={cn(
                    'w-full',
                    state === 'collapsed' ? 'flex justify-center items-center' : 'p-4'
                )}
            >
                <motion.div initial="rest" whileHover="hover" whileTap="tap" className="w-full">
                    <Button
                        className="w-full"
                        variant={'outline'}
                        onClick={() => setOpen(!open)}
                        size={state === 'collapsed' ? 'icon' : 'default'}
                    >
                        {state === 'expanded' ? (
                            <>
                                <PanelLeftCloseIcon className="size-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Close Panel</p>
                            </>
                        ) : (
                            <PanelLeftOpenIcon className="size-3" />
                        )}
                    </Button>
                </motion.div>

                <Separator className={cn(state === 'expanded' ? 'my-2' : 'my-0')} />
                <UserProfile state={state} />
            </SidebarFooter>
        </Sidebar>
    );
}
