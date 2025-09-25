"use client";

import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SquarePlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { useTRPC } from "@/lib/trpc/trpc";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

export const Header: React.FC<{ userId: string }> = ({ userId }) => {
	const trpc = useTRPC();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [isOpen, setIsOpen] = useState(false);
	const [spaceTitle, setSpaceTitle] = useState("");
	const [spaceDescription, setSpaceDescription] = useState("");
	const [customIns, setCustomIns] = useState("");

	const mutation = useMutation(trpc.space.createSpace.mutationOptions());

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!spaceTitle) {
			return toast.error("Space name is required");
		}

		try {
			const res = await mutation.mutateAsync({
				userId,
				spaceTitle,
				spaceDescription,
				spaceCustomInstructions: customIns,
			});
			setIsOpen(false);
			router.push(`/s/${res.id}`);
			await queryClient.invalidateQueries(trpc.space.getSpaces.pathFilter());
			return toast.success("Successfully Created a New Space.");
		} catch (err) {
			toast.error("Uh oh!", { description: (err as Error).message });
		}
	};

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-row items-center justify-start gap-5"
			initial={{ opacity: 0, y: 20 }}
			transition={{ type: "spring", stiffness: 200, damping: 10 }}
		>
			<h1 className="text-3xl">My Spaces</h1>
			<Dialog onOpenChange={setIsOpen} open={isOpen}>
				<DialogTrigger asChild>
					<Button className="text-xs" size={"sm"} variant={"secondary"}>
						<SquarePlusIcon /> New Space
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-xl">Create a New Space</DialogTitle>
					</DialogHeader>
					<Separator />
					<AnimatePresence>
						<motion.form
							animate={{ opacity: 1, y: 0 }}
							className="space-y-4"
							initial={{ opacity: 0, y: 20 }}
							onSubmit={handleSubmit}
							transition={{ duration: 0.3 }}
						>
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="space-y-1"
								initial={{ opacity: 0, y: 20 }}
								transition={{ delay: 0.1 }}
							>
								<Label className="text-muted-foreground text-xs">Title</Label>
								<Input
									disabled={mutation.isPending}
									id="spaceName"
									onChange={(e) => setSpaceTitle(e.target.value)}
									placeholder="Enter space name"
									required
									value={spaceTitle}
								/>
							</motion.div>

							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="space-y-1"
								initial={{ opacity: 0, y: 20 }}
								transition={{ delay: 0.1 }}
							>
								<Label className="text-muted-foreground text-xs">Description (optional)</Label>
								<Textarea
									disabled={mutation.isPending}
									id="spaceDescription"
									onChange={(e) => setSpaceDescription(e.target.value)}
									placeholder="Political and Economical state of the World..."
									value={spaceDescription}
								/>
							</motion.div>

							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="space-y-1"
								initial={{ opacity: 0, y: 20 }}
								transition={{ delay: 0.1 }}
							>
								<Label className="text-muted-foreground text-xs">Custom Instructions (optional)</Label>
								<Textarea
									disabled={mutation.isPending}
									id="customIns"
									onChange={(e) => setCustomIns(e.target.value)}
									placeholder="Explain like you're tutoring an eight year old..."
									value={customIns}
								/>
							</motion.div>
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="flex w-full justify-end"
								initial={{ opacity: 0, y: 20 }}
								transition={{ delay: 0.2 }}
							>
								<Button className="text-xs" disabled={mutation.isPending} type="submit">
									{mutation.isPending ? <Loader /> : "Create Space"}
								</Button>
							</motion.div>
						</motion.form>
					</AnimatePresence>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
};
