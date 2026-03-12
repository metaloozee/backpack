"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { Spinner } from "../spinner";

type SignInButtonProps = Omit<
	ComponentPropsWithoutRef<typeof Button>,
	"onClick"
> & {
	provider: "google" | "github";
	children: ReactNode;
};

export function SignInButton({
	provider,
	children,
	...props
}: SignInButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleSignIn = async () => {
		setIsLoading(true);
		await authClient.signIn.social({
			provider,
			callbackURL: "/",
			errorCallbackURL: "/sign-in?error=auth",
		});
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
					<Spinner size="sm" />
				</div>
			)}
			<div
				className={`flex items-center gap-2 transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}
			>
				{children}
			</div>
		</Button>
	);
}
