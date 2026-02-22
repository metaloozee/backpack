"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	ChevronDownIcon,
	SettingsIcon,
	Trash2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Disclosure,
	DisclosureContent,
	DisclosureTrigger,
} from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	buttonVariants,
	fadeVariants,
	iconVariants,
	modalVariants,
	staggerVariants,
	transitions,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/trpc";

interface SettingsDialogProps {
	spaceId: string;
	spaceName?: string;
	spaceDescription?: string;
	spaceCustomInstructions?: string;
}

interface SettingsDialogFormProps {
	spaceId: string;
	spaceName?: string;
	spaceDescription?: string;
	spaceCustomInstructions?: string;
	updateMutation: {
		mutate: (variables: {
			spaceId: string;
			spaceTitle: string;
			spaceDescription?: string;
			spaceCustomInstructions?: string;
		}) => void;
		isPending: boolean;
	};
	setIsOpen: (open: boolean) => void;
	setIsDeleteDialogOpen: (open: boolean) => void;
	isDangerSectionOpen: boolean;
	setIsDangerSectionOpen: (open: boolean) => void;
}

function SettingsDialogForm({
	spaceId,
	spaceName,
	spaceDescription,
	spaceCustomInstructions,
	updateMutation,
	setIsOpen,
	setIsDeleteDialogOpen,
	isDangerSectionOpen,
	setIsDangerSectionOpen,
}: SettingsDialogFormProps) {
	const form = useForm({
		defaultValues: {
			title: spaceName || "",
			description: spaceDescription || "",
			customInstructions: spaceCustomInstructions || "",
		},
		onSubmit: ({ value }) => {
			updateMutation.mutate({
				spaceId,
				spaceTitle: value.title,
				spaceDescription: value.description || undefined,
				spaceCustomInstructions: value.customInstructions || undefined,
			});
		},
	});

	return (
		<motion.div
			animate="visible"
			className="w-full min-w-0 space-y-4"
			initial="hidden"
			transition={transitions.smooth}
			variants={modalVariants}
		>
			<DialogHeader>
				<motion.div
					animate="visible"
					initial="hidden"
					variants={fadeVariants}
				>
					<DialogTitle>Space Settings</DialogTitle>
				</motion.div>
			</DialogHeader>
			<Separator />
			<form
				className="w-full min-w-0 space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<motion.div
					animate="visible"
					className="w-full min-w-0 space-y-4"
					initial="hidden"
					transition={staggerVariants.container.visible.transition}
					variants={staggerVariants.container}
				>
					<form.Field
						name="title"
						validators={{
							onChange: ({ value }) =>
								!value || value.trim().length === 0
									? "Space title is required"
									: "",
						}}
					>
						{(field) => (
							<motion.div
								className="space-y-2"
								variants={staggerVariants.item}
							>
								<Label htmlFor={field.name}>Space Title</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
									placeholder="Enter space title"
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

					<form.Field name="description">
						{(field) => (
							<motion.div
								className="space-y-2"
								variants={staggerVariants.item}
							>
								<Label htmlFor={field.name}>Description</Label>
								<Textarea
									className="max-h-12 resize-none"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
									placeholder="Enter space description"
									value={field.state.value}
								/>
							</motion.div>
						)}
					</form.Field>

					<form.Field name="customInstructions">
						{(field) => (
							<motion.div
								className="space-y-2"
								variants={staggerVariants.item}
							>
								<Label htmlFor={field.name}>
									Custom Instructions
								</Label>
								<Textarea
									className="h-full max-h-56 min-h-12"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
									placeholder="Enter custom instructions for this space"
									value={field.state.value}
								/>
							</motion.div>
						)}
					</form.Field>
				</motion.div>

				<Disclosure
					className="space-y-2"
					onOpenChange={setIsDangerSectionOpen}
					open={isDangerSectionOpen}
					transition={transitions.smooth}
				>
					<DisclosureTrigger>
						<div className="flex cursor-pointer items-center justify-between rounded-lg border border-red-900/30 bg-red-950/20 p-4 transition-colors hover:bg-red-950/30">
							<div className="flex items-center gap-3">
								<AlertTriangleIcon className="size-5 text-red-500" />
								<div>
									<h3 className="font-semibold text-red-500 text-sm">
										Danger Zone
									</h3>
									<p className="text-neutral-400 text-xs">
										Irreversible and destructive actions
									</p>
								</div>
							</div>
							<motion.div
								animate={{
									rotate: isDangerSectionOpen ? 180 : 0,
								}}
								transition={transitions.smooth}
							>
								<ChevronDownIcon className="size-5 text-neutral-400" />
							</motion.div>
						</div>
					</DisclosureTrigger>
					<DisclosureContent>
						<div className="space-y-3 rounded-lg border border-red-900/30 bg-red-950/10 p-4">
							<div className="space-y-2">
								<h4 className="font-medium text-neutral-200 text-sm">
									Delete Space
								</h4>
								<p className="text-neutral-400 text-xs">
									Once you delete a space, there is no going
									back. This will permanently delete all
									chats, messages, and data associated with
									this space.
								</p>
							</div>
							<motion.div
								initial="rest"
								whileHover="hover"
								whileTap="tap"
							>
								<Button
									onClick={() => setIsDeleteDialogOpen(true)}
									type="button"
									variant="destructive"
								>
									<Trash2Icon className="size-4" />
									Delete Space
								</Button>
							</motion.div>
						</div>
					</DisclosureContent>
				</Disclosure>
				<DialogFooter className="w-full min-w-0">
					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting,
						]}
					>
						{([canSubmit, isSubmitting]) => (
							<motion.div
								animate="visible"
								className="flex w-full min-w-0 justify-end gap-2"
								initial="hidden"
								transition={{
									delay: 0.3,
									...transitions.smooth,
								}}
								variants={fadeVariants}
							>
								<motion.div
									initial="rest"
									variants={buttonVariants}
									whileHover="hover"
									whileTap="tap"
								>
									<Button
										onClick={() => setIsOpen(false)}
										type="button"
										variant="outline"
									>
										Cancel
									</Button>
								</motion.div>
								<motion.div
									initial="rest"
									variants={buttonVariants}
									whileHover="hover"
									whileTap="tap"
								>
									<Button
										disabled={
											!canSubmit ||
											isSubmitting ||
											updateMutation.isPending
										}
										type="submit"
										variant="secondary"
									>
										{isSubmitting ||
										updateMutation.isPending
											? "Saving..."
											: "Save Settings"}
									</Button>
								</motion.div>
							</motion.div>
						)}
					</form.Subscribe>
				</DialogFooter>
			</form>
		</motion.div>
	);
}

export function SettingsDialog({
	spaceId,
	spaceName,
	spaceDescription,
	spaceCustomInstructions,
}: SettingsDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [dialogOpenKey, setDialogOpenKey] = useState(0);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDangerSectionOpen, setIsDangerSectionOpen] = useState(false);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (open) {
			setDialogOpenKey((k) => k + 1);
			setIsDangerSectionOpen(false);
		}
	};

	const updateMutation = useMutation({
		...trpc.space.updateSpace.mutationOptions(),
		onError: (error) => {
			toast.error(error.message || "Failed to update space settings");
		},
		onSuccess: async () => {
			toast.success("Space settings updated successfully");

			await queryClient.invalidateQueries(
				trpc.space.getSpaceOverview.pathFilter()
			);
			await queryClient.invalidateQueries(
				trpc.space.getSpaces.pathFilter()
			);

			setIsOpen(false);
		},
	});

	const deleteMutation = useMutation({
		...trpc.space.deleteSpace.mutationOptions(),
		onSuccess: async () => {
			toast.success("Space deleted successfully");

			setIsDeleteDialogOpen(false);
			setIsOpen(false);

			await queryClient.invalidateQueries(
				trpc.space.getSpaces.pathFilter()
			);

			router.push("/s");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete space");
		},
	});

	return (
		<>
			<Dialog onOpenChange={handleOpenChange} open={isOpen}>
				<DialogTrigger asChild>
					<Button size={"sm"} variant="outline">
						<motion.div
							initial="rest"
							variants={iconVariants}
							whileHover="hover"
						>
							<SettingsIcon className="size-4" />
						</motion.div>
						Settings
					</Button>
				</DialogTrigger>
				<DialogContent className="w-full max-w-[calc(100%-2rem)] bg-neutral-950 sm:max-w-4xl">
					<SettingsDialogForm
						isDangerSectionOpen={isDangerSectionOpen}
						key={dialogOpenKey}
						setIsDangerSectionOpen={setIsDangerSectionOpen}
						setIsDeleteDialogOpen={setIsDeleteDialogOpen}
						setIsOpen={setIsOpen}
						spaceCustomInstructions={spaceCustomInstructions}
						spaceDescription={spaceDescription}
						spaceId={spaceId}
						spaceName={spaceName}
						updateMutation={updateMutation}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
			>
				<DialogContent className="bg-neutral-950">
					<motion.div
						animate="visible"
						className="w-full min-w-0"
						exit="exit"
						initial="hidden"
						variants={modalVariants}
					>
						<DialogHeader className="space-y-5">
							<motion.div
								animate="visible"
								className="space-y-2"
								initial="hidden"
								variants={staggerVariants.container}
							>
								<motion.div variants={staggerVariants.item}>
									<DialogTitle>
										Are you absolutely sure?
									</DialogTitle>
								</motion.div>

								<motion.div variants={staggerVariants.item}>
									<DialogDescription className="text-sm">
										This action cannot be undone. All chats,
										messages, and data associated with this
										space will be permanently deleted.
									</DialogDescription>
								</motion.div>
							</motion.div>

							<div className="flex w-full min-w-0 flex-row-reverse gap-2">
								<motion.div
									initial="rest"
									whileHover="hover"
									whileTap="tap"
								>
									<Button
										className="text-xs"
										disabled={deleteMutation.isPending}
										onClick={() =>
											deleteMutation.mutate({ spaceId })
										}
										type="button"
										variant="destructive"
									>
										{deleteMutation.isPending
											? "deleting..."
											: "delete space"}
									</Button>
								</motion.div>
								<motion.div
									initial="rest"
									whileHover="hover"
									whileTap="tap"
								>
									<Button
										className="text-xs"
										disabled={deleteMutation.isPending}
										onClick={() =>
											setIsDeleteDialogOpen(false)
										}
										type="button"
										variant="link"
									>
										cancel
									</Button>
								</motion.div>
							</div>
						</DialogHeader>
					</motion.div>
				</DialogContent>
			</Dialog>
		</>
	);
}
