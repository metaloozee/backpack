/** biome-ignore-all lint/style/noMagicNumbers: magic numbers */
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { transitions } from "@/lib/animations";

export function PureMessageActions({ message, isLoading }: { message: UIMessage; isLoading: boolean }) {
	const [_, copyToClipboard] = useCopyToClipboard();
	const [isCopied, setIsCopied] = useState(false);
	const [isThumbsUp, setIsThumbsUp] = useState(false);
	const [isThumbsDown, setIsThumbsDown] = useState(false);

	useEffect(() => {
		if (isCopied) {
			const timer = setTimeout(() => {
				setIsCopied(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [isCopied]);

	useEffect(() => {
		if (isThumbsUp) {
			const timer = setTimeout(() => {
				setIsThumbsUp(false);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [isThumbsUp]);

	useEffect(() => {
		if (isThumbsDown) {
			const timer = setTimeout(() => {
				setIsThumbsDown(false);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [isThumbsDown]);

	if (isLoading) {
		return null;
	}
	if (message.role === "user") {
		return null;
	}

	return (
		<TooltipProvider delayDuration={0}>
			<div className="flex w-full flex-row flex-wrap gap-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.div initial="rest" whileHover="hover" whileTap="tap">
							<Button
								className="text-xs"
								onClick={async () => {
									const textFromParts = message.parts
										?.filter((part) => part.type === "text")
										.map((part) => part.text)
										.join("\n")
										.trim();

									if (!textFromParts) {
										return toast.error("There is no text to copy.");
									}

									await copyToClipboard(textFromParts);
									setIsCopied(true);
								}}
								size={"icon"}
								variant={"ghost"}
							>
								<AnimatePresence initial={false} mode="wait">
									{isCopied ? (
										<motion.div
											animate={{ scale: 1, opacity: 1, rotate: 0 }}
											exit={{ scale: 0, opacity: 0, rotate: 180 }}
											initial={{ scale: 0, opacity: 0, rotate: -180 }}
											key="check"
											transition={transitions.bouncy}
										>
											<CheckIcon className="size-3" />
										</motion.div>
									) : (
										<motion.div
											animate={{ scale: 1, opacity: 1, rotate: 0 }}
											exit={{ scale: 0, opacity: 0, rotate: 180 }}
											initial={{ scale: 0, opacity: 0, rotate: -180 }}
											key="copy"
											transition={transitions.smooth}
										>
											<CopyIcon className="size-3" />
										</motion.div>
									)}
								</AnimatePresence>
							</Button>
						</motion.div>
					</TooltipTrigger>
					<TooltipContent sideOffset={10}>
						<p>{isCopied ? "Copied!" : "Copy message"}</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<motion.div initial="rest" whileHover="hover" whileTap="tap">
							<Button
								className="text-xs"
								onClick={() => {
									setIsThumbsUp(true);
								}}
								size={"icon"}
								variant={"ghost"}
							>
								<AnimatePresence initial={false} mode="wait">
									{isThumbsUp ? (
										<motion.div
											animate={{ scale: 1, opacity: 1, rotate: 0 }}
											exit={{ scale: 0, opacity: 0, rotate: 180 }}
											initial={{ scale: 0, opacity: 0, rotate: -180 }}
											key="thumbs-up-active"
											transition={transitions.bouncy}
										>
											<ThumbsUpIcon className="size-3 fill-current" />
										</motion.div>
									) : (
										<motion.div
											animate={{ scale: 1, opacity: 1, rotate: 0 }}
											exit={{ scale: 0, opacity: 0, rotate: 180 }}
											initial={{ scale: 0, opacity: 0, rotate: -180 }}
											key="thumbs-up"
											transition={transitions.smooth}
										>
											<ThumbsUpIcon className="size-3" />
										</motion.div>
									)}
								</AnimatePresence>
							</Button>
						</motion.div>
					</TooltipTrigger>
					<TooltipContent sideOffset={10}>
						<p>{isThumbsUp ? "Liked!" : "Like message"}</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<motion.div initial="rest" whileHover="hover" whileTap="tap">
							<Button
								className="text-xs"
								onClick={() => {
									setIsThumbsDown(true);
								}}
								size={"icon"}
								variant={"ghost"}
							>
								<AnimatePresence initial={false} mode="wait">
									{isThumbsDown ? (
										<motion.div
											animate={{ scale: 1, opacity: 1, rotate: 0 }}
											exit={{ scale: 0, opacity: 0, rotate: 180 }}
											initial={{ scale: 0, opacity: 0, rotate: -180 }}
											key="thumbs-down-active"
											transition={transitions.bouncy}
										>
											<ThumbsDownIcon className="size-3 fill-current" />
										</motion.div>
									) : (
										<motion.div
											animate={{ scale: 1, opacity: 1, rotate: 0 }}
											exit={{ scale: 0, opacity: 0, rotate: 180 }}
											initial={{ scale: 0, opacity: 0, rotate: -180 }}
											key="thumbs-down"
											transition={transitions.smooth}
										>
											<ThumbsDownIcon className="size-3" />
										</motion.div>
									)}
								</AnimatePresence>
							</Button>
						</motion.div>
					</TooltipTrigger>
					<TooltipContent sideOffset={10}>
						<p>{isThumbsDown ? "Disliked!" : "Dislike message"}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
	if (!equal(prevProps.isLoading, nextProps.isLoading)) {
		return false;
	}
	return true;
});
