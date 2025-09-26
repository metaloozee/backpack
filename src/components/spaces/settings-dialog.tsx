"use client";

import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SettingsDialogProps = {
	spaceId: string;
	spaceName?: string;
	spaceDescription?: string;
};

export function SettingsDialog({ spaceName, spaceDescription }: SettingsDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState({
		title: spaceName || "",
		description: spaceDescription || "",
		customInstructions: "",
	});

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement settings update functionality
		setIsOpen(false);
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button size={"sm"} variant="outline">
					<SettingsIcon className="size-4" />
					Settings
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-2xl bg-neutral-950">
				<DialogHeader>
					<DialogTitle>Space Settings</DialogTitle>
				</DialogHeader>
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Space Title</Label>
							<Input
								className="focus-visible:ring-1"
								id="title"
								onChange={(e) => handleInputChange("title", e.target.value)}
								placeholder="Enter space title"
								value={formData.title}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								className="min-h-20 focus-visible:ring-1"
								id="description"
								onChange={(e) => handleInputChange("description", e.target.value)}
								placeholder="Enter space description"
								value={formData.description}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="customInstructions">Custom Instructions</Label>
							<Textarea
								className="min-h-32 focus-visible:ring-1"
								id="customInstructions"
								onChange={(e) => handleInputChange("customInstructions", e.target.value)}
								placeholder="Enter custom instructions for this space"
								value={formData.customInstructions}
							/>
						</div>
					</div>

					<DialogFooter className="w-full">
						<div className="flex w-full justify-end gap-2">
							<Button onClick={() => setIsOpen(false)} type="button" variant="outline">
								Cancel
							</Button>
							<Button type="submit" variant="secondary">
								Save Settings
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
