import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { AlertCircleIcon, BackpackIcon } from "lucide-react";
import Image from "next/image";
import Google from "public/icons/google.svg";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type SearchParamValue = string | string[] | undefined;

const getFirstQueryValue = (value: SearchParamValue): string | undefined => {
	return Array.isArray(value) ? value[0] : value;
};

const normalizeRedirectMessage = (
	value: SearchParamValue
): string | undefined => {
	const rawValue = getFirstQueryValue(value)?.trim();

	if (!rawValue) {
		return undefined;
	}

	const decodedValue = (() => {
		try {
			return decodeURIComponent(rawValue);
		} catch {
			return rawValue;
		}
	})();

	const normalizedValue = decodedValue.replaceAll("_", " ").trim();
	return normalizedValue.length > 0 ? normalizedValue : undefined;
};

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{
		error?: SearchParamValue;
		error_description?: SearchParamValue;
		message?: SearchParamValue;
	}>;
}) {
	const { error } = await searchParams;

	console.log(error);

	return (
		<div className="mx-auto flex h-screen w-full flex-col items-center justify-center gap-7 px-4 py-4">
			<div className="flex flex-col items-center justify-center gap-2">
				<div className="flex size-16 items-center justify-center rounded-full border border-border/70 bg-muted text-foreground dark:border-transparent dark:bg-neutral-800">
					<BackpackIcon className="size-8" />
				</div>

				<h1 className="text-4xl">backpack</h1>
				<p className="text-muted-foreground text-xs">
					Sign in with an approved email address to access the early
					release.
				</p>
				{error ? (
					<Alert
						className="mt-4 w-full max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50"
						variant={"destructive"}
					>
						<AlertCircleIcon />
						<AlertTitle>Something went wrong.</AlertTitle>
						<AlertDescription className="text-amber-900 dark:text-amber-50">
							{normalizeRedirectMessage(error)}
						</AlertDescription>
					</Alert>
				) : null}
			</div>
			<div className="flex w-full max-w-sm flex-col gap-2">
				<SignInButton provider="google">
					<Image
						alt="Login with Google"
						className="size-5 dark:invert"
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
