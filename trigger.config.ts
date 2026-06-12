import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
	project: "proj_efccqnrqqvezcjhtadbq",
	runtime: "node",
	logLevel: "log",
	maxDuration: 3600,
	dirs: ["./src/trigger"],
	build: {
		external: ["pg"],
	},
});
