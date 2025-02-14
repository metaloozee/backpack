'use client';

import * as React from 'react';
import { BackpackIcon, X } from 'lucide-react';
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
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{
                                duration: 0.1,
                                type: 'spring',
                                stiffness: 400,
                                damping: 10,
                            }}
                            className="w-full flex justify-center items-center gap-2"
                        >
                            <BackpackIcon className="size-4" />
                            <h2 className="text-lg font-light">backpack</h2>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{
                                duration: 0.1,
                                type: 'spring',
                                stiffness: 400,
                                damping: 10,
                            }}
                        >
                            <BackpackIcon className="size-4" />
                        </motion.div>
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
