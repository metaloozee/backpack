'use client';

import * as React from 'react';
import { BackpackIcon } from 'lucide-react';
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
            <SidebarFooter className="p-2.5">
                <SidebarTrigger />
            </SidebarFooter>
        </Sidebar>
    );
}
