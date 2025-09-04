"use client";

import { useRouter } from "next/navigation";
import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { authClient } from "@/lib/auth/client";

type SignOutButtonProps = Omit<ComponentPropsWithoutRef<typeof Button>, "onClick"> & {
	children?: ReactNode;
};

export function SignOutButton({ children, ...props }: SignOutButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSignOut = async () => {
		setIsLoading(true);
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/sign-in");
				},
			},
		});
	};

	return (
		<Button
			variant={"destructive"}
			{...props}
			className={`relative justify-center ${props.className || ""}`}
			disabled={props.disabled || isLoading}
			onClick={handleSignOut}
		>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center">
					<Loader size="md" />
				</div>
			)}
			<div
				className={`flex items-center justify-center transition-opacity ${
					isLoading ? "opacity-0" : "opacity-100"
				}`}
			>
				{children ?? "Sign out"}
			</div>
		</Button>
	);
}
