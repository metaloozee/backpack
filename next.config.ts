import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "www.google.com",
			},
			{
				protocol: "https",
				hostname: "prmwl2lhrsof7i4o.public.blob.vercel-storage.com",
			},
		],
	},
	experimental: {
		useCache: true,
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
};

export default withWorkflow(nextConfig);
