'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LibraryIcon, PlusIcon, SquarePlusIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'timeago.js';

type Space = {
    id: string;
    userId: string;
    spaceTitle: string;
    spaceDescription?: string | null;
    spaceCustomInstructions?: string | null;
    createdAt: Date;
};

export function Cards({ spaces }: { spaces: Array<Space> }) {
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: 0.2,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
        },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full mx-auto gap-5 grid grid-cols-3 mt-5"
        >
            {spaces.map((space) => (
                <motion.div
                    variants={itemVariants}
                    key={space.id}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                >
                    <Link href={`/s/${space.id}`}>
                        <Card className="w-full h-full bg-neutral-900/50 hover:bg-neutral-900/70 transition-all duration-200">
                            <CardHeader>
                                <LibraryIcon />
                                <CardTitle>{space.spaceTitle}</CardTitle>
                            </CardHeader>
                            <CardFooter className="flex flex-row flex-wrap gap-2 justify-between text-xs text-muted-foreground">
                                {space.spaceDescription && (
                                    <p className="truncate w-[18vw]">{space.spaceDescription}</p>
                                )}
                                {format(space.createdAt)}
                            </CardFooter>
                        </Card>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}
