import type { NextConfig } from "next";

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
		],
	},
	experimental: {
		useCache: true,
		reactCompiler: true,
	},
};

export default nextConfig;
