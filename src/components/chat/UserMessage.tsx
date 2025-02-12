'use client';

import * as React from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { UserCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const UserMessage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className="w-full flex justify-start items-start py-4">
            <Avatar className="mr-2">
                <AvatarFallback className="bg-zinc-900">
                    <UserCircleIcon className="size-5 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="flex-1 break-words w-full p-2 rounded-lg text-muted-foreground"
            >
                {message}
            </motion.div>
        </div>
    );
};
