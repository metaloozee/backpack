"use client";

import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SquarePlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

	const mutation = useMutation(trpc.space.createSpace.mutationOptions());

	const form = useForm({
		defaultValues: {
			spaceTitle: "",
			spaceDescription: "",
			customInstructions: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const res = await mutation.mutateAsync({
					userId,
					spaceTitle: value.spaceTitle,
					spaceDescription: value.spaceDescription || undefined,
					spaceCustomInstructions:
						value.customInstructions || undefined,
				});
				setIsOpen(false);
				form.reset();
				router.push(`/s/${res.id}`);
				await queryClient.invalidateQueries(
					trpc.space.getSpaces.pathFilter()
				);
				toast.success("Successfully Created a New Space.");
			} catch (err) {
				toast.error("Uh oh!", { description: (err as Error).message });
			}
		},
	});

	useEffect(() => {
		if (isOpen) {
			form.reset();
		}
	}, [isOpen, form]);

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
					<Button
						className="text-xs"
						size={"sm"}
						variant={"secondary"}
					>
						<SquarePlusIcon /> New Space
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-xl">
							Create a New Space
						</DialogTitle>
					</DialogHeader>
					<Separator />
					<AnimatePresence>
						<motion.form
							animate={{ opacity: 1, y: 0 }}
							className="space-y-4"
							initial={{ opacity: 0, y: 20 }}
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							transition={{ duration: 0.3 }}
						>
							<form.Field
								name="spaceTitle"
								validators={{
									onChange: ({ value }) =>
										!value || value.trim().length === 0
											? "Space title is required"
											: "",
								}}
							>
								{(field) => (
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										className="space-y-1"
										initial={{ opacity: 0, y: 20 }}
										transition={{ delay: 0.1 }}
									>
										<Label className="text-muted-foreground text-xs">
											Title
										</Label>
										<Input
											disabled={mutation.isPending}
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="Enter space name"
											value={field.state.value}
										/>
										{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 ? (
											<p className="text-red-500 text-sm">
												{field.state.meta.errors[0]}
											</p>
										) : null}
									</motion.div>
								)}
							</form.Field>

							<form.Field name="spaceDescription">
								{(field) => (
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										className="space-y-1"
										initial={{ opacity: 0, y: 20 }}
										transition={{ delay: 0.1 }}
									>
										<Label className="text-muted-foreground text-xs">
											Description (optional)
										</Label>
										<Textarea
											disabled={mutation.isPending}
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="Political and Economical state of the World..."
											value={field.state.value}
										/>
									</motion.div>
								)}
							</form.Field>

							<form.Field name="customInstructions">
								{(field) => (
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										className="space-y-1"
										initial={{ opacity: 0, y: 20 }}
										transition={{ delay: 0.1 }}
									>
										<Label className="text-muted-foreground text-xs">
											Custom Instructions (optional)
										</Label>
										<Textarea
											disabled={mutation.isPending}
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="Explain like you're tutoring an eight year old..."
											value={field.state.value}
										/>
									</motion.div>
								)}
							</form.Field>

							<form.Subscribe
								selector={(state) => [
									state.canSubmit,
									state.isSubmitting,
								]}
							>
								{([canSubmit, isSubmitting]) => (
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										className="flex w-full justify-end"
										initial={{ opacity: 0, y: 20 }}
										transition={{ delay: 0.2 }}
									>
										<Button
											className="text-xs"
											disabled={
												!canSubmit ||
												isSubmitting ||
												mutation.isPending
											}
											type="submit"
										>
											{isSubmitting ||
											mutation.isPending ? (
												<Loader />
											) : (
												"Create Space"
											)}
										</Button>
									</motion.div>
								)}
							</form.Subscribe>
						</motion.form>
					</AnimatePresence>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
};
