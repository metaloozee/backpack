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
            className="w-full flex justify-start items-center py-4"
        >
            <Avatar className="mr-2">
                <AvatarFallback className="bg-zinc-900">
                    <UserCircleIcon className="size-4 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
            <div className="-pt-1 text-muted-foreground">{message}</div>
        </motion.div>
    );
};
