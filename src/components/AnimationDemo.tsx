'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    PlayIcon,
    PauseIcon,
    RotateCcwIcon,
    SparklesIcon,
    HeartIcon,
    StarIcon,
} from 'lucide-react';
import {
    fadeVariants,
    slideVariants,
    scaleVariants,
    staggerVariants,
    buttonVariants,
    iconVariants,
    messageVariants,
    modalVariants,
    backdropVariants,
    textVariants,
    createStaggeredList,
    transitions,
} from '@/lib/animations';

export function AnimationDemo() {
    const [showElements, setShowElements] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const demoItems = [
        { id: 1, text: 'Smooth fade animation', icon: SparklesIcon },
        { id: 2, text: 'Slide from different directions', icon: HeartIcon },
        { id: 3, text: 'Scale with gentle easing', icon: StarIcon },
    ];

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <motion.div
                variants={textVariants.container}
                initial="hidden"
                animate="visible"
                className="text-center space-y-4"
            >
                <motion.h1 variants={textVariants.item} className="text-3xl font-bold">
                    Animation System Demo
                </motion.h1>
                <motion.p variants={textVariants.item} className="text-muted-foreground">
                    Showcasing smooth, consistent animations across components
                </motion.p>
            </motion.div>

            {/* Controls */}
            <motion.div
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                className="flex gap-4 justify-center"
            >
                <motion.div
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                >
                    <Button
                        onClick={() => setShowElements(!showElements)}
                        className="gap-2"
                        disableAnimation
                    >
                        {showElements ? (
                            <PauseIcon className="size-4" />
                        ) : (
                            <PlayIcon className="size-4" />
                        )}
                        {showElements ? 'Hide' : 'Show'} Elements
                    </Button>
                </motion.div>

                <motion.div
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                >
                    <Button onClick={() => setShowModal(true)} variant="outline" disableAnimation>
                        Show Modal
                    </Button>
                </motion.div>
            </motion.div>

            {/* Animation Examples */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Fade Animation */}
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Fade Animation</h3>
                    <AnimatePresence>
                        {showElements && (
                            <motion.div
                                variants={fadeVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-2"
                            >
                                <div className="w-full h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg" />
                                <p className="text-sm text-muted-foreground">
                                    Smooth opacity transition
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                {/* Slide Animations */}
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Slide Animations</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {showElements && (
                                <motion.div
                                    variants={slideVariants.up}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full h-6 bg-green-500 rounded"
                                />
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {showElements && (
                                <motion.div
                                    variants={slideVariants.left}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full h-6 bg-yellow-500 rounded"
                                />
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {showElements && (
                                <motion.div
                                    variants={slideVariants.right}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full h-6 bg-red-500 rounded"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </Card>

                {/* Scale Animation */}
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Scale Animation</h3>
                    <AnimatePresence>
                        {showElements && (
                            <motion.div
                                variants={scaleVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-full h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center"
                            >
                                <motion.div
                                    variants={iconVariants}
                                    initial="rest"
                                    whileHover="hover"
                                >
                                    <SparklesIcon className="size-8 text-white" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>

            {/* Staggered List */}
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Staggered List Animation</h3>
                <motion.div
                    variants={staggerVariants.container}
                    initial="hidden"
                    animate={showElements ? 'visible' : 'exit'}
                    className="space-y-2"
                >
                    {demoItems.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={staggerVariants.item}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--muted))' }}
                        >
                            <motion.div variants={iconVariants} initial="rest" whileHover="hover">
                                <item.icon className="size-5 text-primary" />
                            </motion.div>
                            <span>{item.text}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </Card>

            {/* Message-style animations */}
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Message Animations</h3>
                <div className="space-y-3">
                    <AnimatePresence>
                        {showElements && (
                            <>
                                <motion.div
                                    variants={messageVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary"
                                >
                                    User message with smooth entrance
                                </motion.div>
                                <motion.div
                                    variants={messageVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ delay: 0.1 }}
                                    className="p-3 bg-muted/50 rounded-lg"
                                >
                                    Bot response with slight delay
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </Card>

            {/* Modal Demo */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setShowModal(false)}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                variants={modalVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="bg-background border rounded-lg p-6 max-w-md w-full"
                            >
                                <motion.div
                                    variants={textVariants.container}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    <motion.h2
                                        variants={textVariants.item}
                                        className="text-xl font-semibold"
                                    >
                                        Modal Animation
                                    </motion.h2>
                                    <motion.p
                                        variants={textVariants.item}
                                        className="text-muted-foreground"
                                    >
                                        This modal appears with smooth scale and opacity
                                        transitions.
                                    </motion.p>
                                    <motion.div
                                        variants={textVariants.item}
                                        className="flex gap-2 justify-end"
                                    >
                                        <motion.div
                                            variants={buttonVariants}
                                            initial="rest"
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <Button
                                                onClick={() => setShowModal(false)}
                                                disableAnimation
                                            >
                                                Close
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
