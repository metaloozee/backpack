'use client';

import { motion } from 'motion/react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { SquarePlusIcon } from 'lucide-react';

export function Header() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="flex flex-row justify-start items-center gap-5"
        >
            <h1 className="text-3xl">My Chats</h1>

            <Button asChild variant={'secondary'} size={'sm'} className="text-xs">
                <Link href="/">
                    <SquarePlusIcon /> New Chat
                </Link>
            </Button>
        </motion.div>
    );
}
