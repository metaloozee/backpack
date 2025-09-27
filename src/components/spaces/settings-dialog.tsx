"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsIcon } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

type SettingsDialogProps = {
	spaceId: string;
	spaceName?: string;
	spaceDescription?: string;
	spaceCustomInstructions?: string;
};

type SpaceOverviewData = {
	spaceData: {
		id: string;
		spaceTitle: string;
		spaceDescription: string | null;
		spaceCustomInstructions: string | null;
		userId: string;
		createdAt: Date;
	};
	hasChats: boolean;
};

type SpacesListData = {
	spaces: Array<{
		id: string;
		spaceTitle: string;
		spaceDescription: string | null;
		spaceCustomInstructions: string | null;
		userId: string;
		createdAt: Date;
	}>;
};

export function SettingsDialog({ spaceId, spaceName, spaceDescription, spaceCustomInstructions }: SettingsDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState({
		title: spaceName || "",
		description: spaceDescription || "",
		customInstructions: spaceCustomInstructions || "",
	});

	const resetFormData = useCallback(() => {
		setFormData({
			title: spaceName || "",
			description: spaceDescription || "",
			customInstructions: spaceCustomInstructions || "",
		});
	}, [spaceName, spaceDescription, spaceCustomInstructions]);

	const mutation = useMutation({
		...trpc.space.updateSpace.mutationOptions(),
		onMutate: async (variables) => {
			await queryClient.cancelQueries(trpc.space.getSpaceOverview.pathFilter());
			await queryClient.cancelQueries(trpc.space.getSpaces.pathFilter());

			const previousSpaceOverview = queryClient.getQueryData<SpaceOverviewData>(
				trpc.space.getSpaceOverview.queryKey({ spaceId })
			);
			const previousSpaces = queryClient.getQueriesData<SpacesListData>(trpc.space.getSpaces.pathFilter());

			queryClient.setQueryData<SpaceOverviewData>(trpc.space.getSpaceOverview.queryKey({ spaceId }), (old) => {
				if (!old?.spaceData) {
					return old;
				}
				return {
					...old,
					spaceData: {
						...old.spaceData,
						spaceTitle: variables.spaceTitle,
						spaceDescription: variables.spaceDescription || null,
						spaceCustomInstructions: variables.spaceCustomInstructions || null,
					},
				};
			});

			for (const [queryKey] of previousSpaces) {
				queryClient.setQueryData<SpacesListData>(queryKey, (old) => {
					if (!old?.spaces) {
						return old;
					}
					return {
						spaces: old.spaces.map((space) =>
							space.id === spaceId
								? {
										...space,
										spaceTitle: variables.spaceTitle,
										spaceDescription: variables.spaceDescription || null,
										spaceCustomInstructions: variables.spaceCustomInstructions || null,
									}
								: space
						),
					};
				});
			}

			return { previousSpaceOverview, previousSpaces };
		},
		onError: (error, _variables, context) => {
			if (context?.previousSpaceOverview) {
				queryClient.setQueryData(
					trpc.space.getSpaceOverview.queryKey({ spaceId }),
					context.previousSpaceOverview
				);
			}
			if (context?.previousSpaces) {
				for (const [queryKey, queryData] of context.previousSpaces) {
					queryClient.setQueryData(queryKey, queryData);
				}
			}
			toast.error(error.message || "Failed to update space settings");
		},
		onSuccess: () => {
			toast.success("Space settings updated successfully");
			resetFormData();
			setIsOpen(false);
		},
		onSettled: () => {
			queryClient.invalidateQueries(trpc.space.getSpaceOverview.pathFilter());
			queryClient.invalidateQueries(trpc.space.getSpaces.pathFilter());
		},
	});

	useEffect(() => {
		resetFormData();
	}, [resetFormData]);

	useEffect(() => {
		if (!isOpen) {
			resetFormData();
		}
	}, [isOpen, resetFormData]);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		mutation.mutate({
			spaceId,
			spaceTitle: formData.title,
			spaceDescription: formData.description || undefined,
			spaceCustomInstructions: formData.customInstructions || undefined,
		});
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button size={"sm"} variant="outline">
					<motion.div initial="rest" variants={iconVariants} whileHover="hover">
						<SettingsIcon className="size-4" />
					</motion.div>
					Settings
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-2xl bg-neutral-950">
				<motion.div
					animate="visible"
					className="space-y-4"
					initial="hidden"
					transition={transitions.smooth}
					variants={modalVariants}
				>
					<DialogHeader>
						<motion.div animate="visible" initial="hidden" variants={fadeVariants}>
							<DialogTitle>Space Settings</DialogTitle>
						</motion.div>
					</DialogHeader>
					<Separator />
					<form className="space-y-6" onSubmit={handleSubmit}>
						<motion.div
							animate="visible"
							className="space-y-4"
							initial="hidden"
							variants={staggerVariants.container}
						>
							<motion.div className="space-y-2" variants={staggerVariants.item}>
								<Label htmlFor="title">Space Title</Label>
								<Input
									id="title"
									onChange={(e) => handleInputChange("title", e.target.value)}
									placeholder="Enter space title"
									value={formData.title}
								/>
							</motion.div>

							<motion.div className="space-y-2" variants={staggerVariants.item}>
								<Label htmlFor="description">Description</Label>
								<Textarea
									className="min-h-20"
									id="description"
									onChange={(e) => handleInputChange("description", e.target.value)}
									placeholder="Enter space description"
									value={formData.description}
								/>
							</motion.div>

							<motion.div className="space-y-2" variants={staggerVariants.item}>
								<Label htmlFor="customInstructions">Custom Instructions</Label>
								<Textarea
									className="min-h-32"
									id="customInstructions"
									onChange={(e) => handleInputChange("customInstructions", e.target.value)}
									placeholder="Enter custom instructions for this space"
									value={formData.customInstructions}
								/>
							</motion.div>
						</motion.div>

						<DialogFooter className="w-full">
							<motion.div
								animate="visible"
								className="flex w-full justify-end gap-2"
								initial="hidden"
								transition={{ delay: 0.3, ...transitions.smooth }}
								variants={fadeVariants}
							>
								<motion.div initial="rest" variants={buttonVariants} whileHover="hover" whileTap="tap">
									<Button
										onClick={() => {
											resetFormData();
											setIsOpen(false);
										}}
										type="button"
										variant="outline"
									>
										Cancel
									</Button>
								</motion.div>
								<motion.div initial="rest" variants={buttonVariants} whileHover="hover" whileTap="tap">
									<Button disabled={mutation.isPending} type="submit" variant="secondary">
										{mutation.isPending ? "Saving..." : "Save Settings"}
									</Button>
								</motion.div>
							</motion.div>
						</DialogFooter>
					</form>
				</motion.div>
			</DialogContent>
		</Dialog>
	);
}
