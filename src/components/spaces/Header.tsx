'use client';

import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { SquarePlusIcon } from 'lucide-react';

export function Header({ userId }: { userId: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="flex flex-row justify-start items-center gap-5"
        >
            <h1 className="text-3xl">My Spaces</h1>
            <Button variant={'secondary'} size={'sm'} className="text-xs text-muted-foreground">
                <SquarePlusIcon /> New Space
            </Button>
        </motion.div>
    );
}
