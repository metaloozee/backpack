import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { BackpackIcon } from "lucide-react";
import Image from "next/image";
import Google from "public/icons/google.svg";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
	return (
		<div className="mx-auto flex h-screen w-full flex-col items-center justify-center gap-7 px-4 py-4">
			<div className="flex flex-col items-center justify-center gap-2">
				<div className="flex size-16 items-center justify-center rounded-full bg-neutral-800">
					<BackpackIcon className="size-8" />
				</div>

				<h1 className="text-4xl">backpack</h1>
				<p className="text-muted-foreground text-xs">
					Sign-in to access your Smart Chat Application.
				</p>
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
