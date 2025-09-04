"use client";

import { LibraryIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { format } from "timeago.js";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Space = {
	id: string;
	userId: string;
	spaceTitle: string;
	spaceDescription?: string | null;
	spaceCustomInstructions?: string | null;
	createdAt: Date;
};

export function Cards({ spaces }: { spaces: Space[] }) {
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
			animate="visible"
			className="mx-auto mt-5 grid w-full grid-cols-3 gap-5"
			initial="hidden"
			variants={containerVariants}
		>
			{spaces.map((space) => (
				<motion.div
					key={space.id}
					transition={{ type: "spring", damping: 10, stiffness: 200 }}
					variants={itemVariants}
				>
					<Link href={`/s/${space.id}`}>
						<Card className="h-full w-full bg-neutral-900/50 transition-all duration-200 hover:bg-neutral-900/70">
							<CardHeader>
								<LibraryIcon />
								<CardTitle>{space.spaceTitle}</CardTitle>
							</CardHeader>
							<CardFooter className="flex flex-row flex-wrap justify-between gap-2 text-muted-foreground text-xs">
								{space.spaceDescription && (
									<p className="w-[18vw] truncate">{space.spaceDescription}</p>
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
