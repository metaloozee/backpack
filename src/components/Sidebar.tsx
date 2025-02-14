'use client';

import * as React from 'react';
import { BackpackIcon, PanelLeftClose, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import UserProfile from './UserProfile';
import { SessionProvider } from 'next-auth/react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';

export function AppSidebar() {
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
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
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
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{
                                    duration: 0.1,
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 15,
                                }}
                            >
                                <BackpackIcon className="size-4" />
                            </motion.div>
                        </Link>
                    )}
                </AnimatePresence>
            </SidebarHeader>
            <SidebarContent>{/* Add your sidebar content here */}</SidebarContent>
            <SidebarFooter className={cn(state === 'collapsed' ? 'p-2.5' : 'p-4')}>
                <Button
                    // size={"sm"}
                    variant={state === 'expanded' ? 'outline' : 'ghost'}
                    onClick={() => setOpen(!open)}
                >
                    {state === 'expanded' ? (
                        <div className="w-full flex flex-row justify-center items-center gap-2">
                            <PanelLeftCloseIcon className="size-7" />
                            <p className="text-xs text-muted-foreground">Close Panel</p>
                        </div>
                    ) : (
                        <PanelLeftOpenIcon className="size-7" />
                    )}
                </Button>

                <Separator className={cn(state === 'expanded' ? 'my-2' : 'my-0')} />
                <SessionProvider>
                    <UserProfile state={state} />
                </SessionProvider>
            </SidebarFooter>
        </Sidebar>
    );
}
