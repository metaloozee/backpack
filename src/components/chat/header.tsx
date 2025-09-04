"use client";

import { SquarePlusIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "../ui/button";

export function Header() {
	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-row items-center justify-start gap-5"
			initial={{ opacity: 0, y: 20 }}
			transition={{ type: "spring", stiffness: 200, damping: 10 }}
		>
			<h1 className="text-3xl">My Chats</h1>

			<Button asChild className="text-xs" size={"sm"} variant={"secondary"}>
				<Link href="/">
					<SquarePlusIcon /> New Chat
				</Link>
			</Button>
		</motion.div>
	);
}
