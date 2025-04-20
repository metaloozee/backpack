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
import UserProfile from '@/components/UserProfile';
import { SessionProvider } from 'next-auth/react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

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
                <AnimatePresence>
                    {state === 'expanded' ? (
                        <Link href={'/'} className="w-full">
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.1,
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 15,
                                }}
                                className="w-full flex justify-center items-center gap-2"
                            >
                                <BackpackIcon className="size-4" />
                                <h2 className="text-lg font-light">backpack</h2>
                            </motion.div>
                        </Link>
                    ) : (
                        <Link href={'/'}>
                            <motion.div
                                key="collapsed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    ease: [0.4, 0, 0.2, 1],
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 20,
                                }}
                            >
                                <BackpackIcon className="size-4" />
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
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        duration: 0.1,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                    }}
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
                                    <SearchIcon />
                                    <p className="font-light">Search</p>
                                </>
                            ) : (
                                <SearchIcon />
                            )}
                        </Link>
                    </Button>

                    <Button
                        asChild
                        className={cn(state === 'expanded' ? 'w-full' : '')}
                        variant={isSpaces ? 'default' : state === 'expanded' ? 'ghost' : 'ghost'}
                        size={state === 'expanded' ? 'default' : 'icon'}
                    >
                        <Link href={'/s/'}>
                            {state === 'expanded' ? (
                                <>
                                    <LibraryIcon />
                                    <p className="font-light">Spaces</p>
                                </>
                            ) : (
                                <LibraryIcon />
                            )}
                        </Link>
                    </Button>

                    <Button
                        asChild
                        className={cn(state === 'expanded' ? 'w-full' : '')}
                        variant={isChats ? 'default' : state === 'expanded' ? 'ghost' : 'ghost'}
                        size={state === 'expanded' ? 'default' : 'icon'}
                    >
                        <Link href={'/c/'}>
                            {state === 'expanded' ? (
                                <>
                                    <MessagesSquareIcon />
                                    <p className="font-light">Chats</p>
                                </>
                            ) : (
                                <MessagesSquareIcon />
                            )}
                        </Link>
                    </Button>
                </motion.div>
            </SidebarContent>
            <SidebarFooter
                className={cn(
                    'w-full',
                    state === 'collapsed' ? 'flex justify-center items-center' : 'p-4'
                )}
            >
                <Button
                    variant={'outline'}
                    onClick={() => setOpen(!open)}
                    size={state === 'collapsed' ? 'icon' : 'default'}
                >
                    {state === 'expanded' ? (
                        <div className="w-full flex flex-row justify-center items-center gap-2">
                            <PanelLeftCloseIcon className="size-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Close Panel</p>
                        </div>
                    ) : (
                        <PanelLeftOpenIcon className="size-4" />
                    )}
                </Button>

                <Separator className={cn(state === 'expanded' ? 'my-2' : 'my-0')} />
                <SessionProvider>
                    <UserProfile state={state} />
                </SessionProvider>

                {/* {state === 'expanded' && (
                    <div className="w-full">
                        <Separator className={cn(state === 'expanded' ? 'my-2' : 'my-0')} />
                        <div className="w-full px-2 flex flex-row justify-around items-center gap-2">
                            <Button variant={'link'}>
                                <InfoIcon className="size-3.5" />
                            </Button>
                            <Button variant={'link'}>
                                <GithubIcon className="size-3.5" />
                            </Button>
                            <Button variant={'link'}>
                                <TwitterIcon className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )} */}
            </SidebarFooter>
        </Sidebar>
    );
}
