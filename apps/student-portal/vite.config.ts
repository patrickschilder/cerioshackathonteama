import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@cerios/shared-types": resolve(__dirname, "../../packages/shared-types/src/index.ts"),
            "@cerios/ui-theme": resolve(__dirname, "../../packages/ui-theme/src/index.ts"),
            "@cerios/ui-theme/theme.css": resolve(__dirname, "../../packages/ui-theme/src/theme.css"),
            "@cerios/ui-theme/components.css": resolve(__dirname, "../../packages/ui-theme/src/components.css"),
        },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
});
