'use client';

import * as React from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { UserCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const UserMessage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="max-w-lg flex justify-end items-center mt-10 py-2 px-4 bg-neutral-900 border rounded-lg"
        >
            <div className="-pt-1 text-muted-foreground">{message}</div>
        </motion.div>
    );
};
