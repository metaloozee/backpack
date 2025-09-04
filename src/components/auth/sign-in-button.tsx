"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { authClient } from "@/lib/auth/client";

type SignInButtonProps = Omit<ComponentPropsWithoutRef<typeof Button>, "onClick"> & {
	provider: "google" | "github";
	children: ReactNode;
};

export function SignInButton({ provider, children, ...props }: SignInButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleSignIn = async () => {
		setIsLoading(true);
		await authClient.signIn.social({ provider });
	};

	return (
		<Button
			size={"lg"}
			variant={"secondary"}
			{...props}
			className={`relative justify-center ${props.className || ""}`}
			disabled={props.disabled || isLoading}
			onClick={handleSignIn}
		>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center">
					<Loader size="md" />
				</div>
			)}
			<div className={`flex items-center gap-2 transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}>
				{children}
			</div>
		</Button>
	);
}
