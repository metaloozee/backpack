import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { BackpackIcon } from "lucide-react";
import Image from "next/image";
import Google from "public/icons/google.svg";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Separator } from "@/components/ui/separator";

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;
	const showUnauthorizedMessage = error === "unauthorized";
	const showAuthErrorMessage = error === "auth";

	let errorMessage: string | null = null;

	if (showUnauthorizedMessage) {
		errorMessage = "This account is not approved for this release.";
	} else if (showAuthErrorMessage) {
		errorMessage =
			"Sign-in failed. Please try again, or check the auth provider configuration.";
	}

	return (
		<div className="mx-auto flex h-screen w-full flex-col items-center justify-center gap-7 px-4 py-4">
			<div className="flex flex-col items-center justify-center gap-2">
				<div className="flex size-16 items-center justify-center rounded-full bg-neutral-800">
					<BackpackIcon className="size-8" />
				</div>

				<h1 className="text-4xl">backpack</h1>
				<p className="text-muted-foreground text-xs">
					Sign in with an approved email address to access the early
					release.
				</p>
				{errorMessage ? (
					<p className="text-center text-destructive text-xs">
						{errorMessage}
					</p>
				) : null}
			</div>
			<div className="mt-5 flex w-full max-w-sm flex-col gap-2">
				<SignInButton disabled provider="google">
					<Image
						alt="Login with Google"
						className="size-5 invert"
						src={Google}
					/>
					Continue with Google
				</SignInButton>
				<SignInButton provider="github">
					<GitHubLogoIcon className="size-5" />
					Continue with GitHub
				</SignInButton>
			</div>
			<Separator className="w-full max-w-xs" />
			<p className="max-w-sm text-center text-muted-foreground text-xs">
				By continuing, you agree to backpack&apos;s Terms of Service and
				Privacy Policy.
			</p>
		</div>
	);
}
