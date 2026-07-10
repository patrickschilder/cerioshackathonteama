import { mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";

import viteConfig from "./vite.config.js";

export default mergeConfig(
	viteConfig,
	defineVitestConfig({
		test: {
			environment: "jsdom",
			setupFiles: ["./vitest.setup.ts"],
			include: ["src/**/*.test.tsx"],
		},
	}),
);
