import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { chats, knowledge, spaces } from '@/lib/db/schema/app';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { ChevronRight } from 'lucide-react';
import { Chat } from '@/components/Chat';
import { generateId } from 'ai';

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
    await checkAuth();
    const { session } = await getUserAuth();

    const user = session!.user;
    const { id: spaceId } = await params;
    const chatId = generateId();

    const [spaceData] = await db
        .select()
        .from(spaces)
        .where(and(eq(spaces.id, spaceId), eq(spaces.userId, user.id)));

    const chatsData = await db
        .select()
        .from(chats)
        .where(and(eq(chats.spaceId, spaceId), eq(chats.userId, user.id)));

    const knowledgeData = await db
        .select()
        .from(knowledge)
        .where(and(eq(knowledge.spaceId, spaceId), eq(knowledge.userId, user.id)));

    if (!spaceData) {
        return notFound();
    }

    return (
        <div className="grid grid-cols-3 mt-20">
            <div className="col-span-2">{/* <Chat id={chatId} /> */}</div>
            <div className="flex flex-col justify-end items-end gap-10">
                <div className="space-y-2">
                    <h1 className="text-3xl">{spaceData.spaceTitle}</h1>
                    <p className="text-muted-foreground text-xs">{spaceData.spaceDescription}</p>
                </div>
                <div className="space-y-4 w-full flex flex-row justify-start items-start">
                    <Accordion
                        className="flex w-full flex-col"
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        variants={{
                            expanded: {
                                opacity: 1,
                                scale: 1,
                            },
                            collapsed: {
                                opacity: 0,
                                scale: 0.7,
                            },
                        }}
                    >
                        <AccordionItem value="custom-instructions" className="py-2 space-y-4">
                            <AccordionTrigger className="w-full border-2 bg-zinc-900/50 rounded-md px-6 py-4 text-left">
                                <div className="flex items-center">
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-expanded:rotate-90 " />
                                    <div className="ml-2">Custom Instructions</div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="origin-left">
                                <p className="pl-6 pr-2 text-zinc-500 dark:text-zinc-400">
                                    {spaceData.spaceCustomInstructions &&
                                    spaceData.spaceCustomInstructions.length > 0
                                        ? spaceData.spaceCustomInstructions
                                        : 'Not found, click on the button below to get started.'}
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="knowledge-base" className="py-2 space-y-4">
                            <AccordionTrigger className="w-full border-2 bg-zinc-900/50 rounded-md px-6 py-4 text-left">
                                <div className="flex items-center">
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-expanded:rotate-90" />
                                    <div className="ml-2">
                                        Knowledge Base{' '}
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            Uploaded Documents
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="origin-left">
                                <p className="pl-6 pr-2 text-zinc-500 dark:text-zinc-400">
                                    Advance your skills by using more complex functions of
                                    Motion-Primitives. Explore how to link animations together,
                                    create intricate sequences, and interact with motion sensors for
                                    dynamic effects.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
