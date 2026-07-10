import { defineConfig, devices } from "@playwright/test";
import path from "path";

// The full docker-compose stack (Postgres, Keycloak, api-elearning) plus both
// portal dev servers must already be running before these tests are executed
// (e.g. via `make start`, or the equivalent docker compose + npm run dev:*
// commands). These tests do not provision that stack themselves.
const ADMIN_PORTAL_URL = process.env["E2E_ADMIN_PORTAL_URL"] ?? "http://localhost:5174";
const STUDENT_PORTAL_URL = process.env["E2E_STUDENT_PORTAL_URL"] ?? "http://localhost:5173";

export default defineConfig({
    testDir: "./tests",
    globalSetup: "./global-setup.ts",
    fullyParallel: true,
    forbidOnly: !!process.env["CI"],
    retries: process.env["CI"] ? 1 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    projects: [
        {
            name: "api",
            testMatch: "api/**/*.spec.ts",
        },
        {
            name: "admin-portal",
            testMatch: "frontend/admin-*.spec.ts",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: ADMIN_PORTAL_URL,
                storageState: path.join(__dirname, ".auth/instructor-admin-portal.json"),
            },
        },
        {
            name: "student-portal",
            testMatch: "frontend/student-*.spec.ts",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: STUDENT_PORTAL_URL,
                storageState: path.join(__dirname, ".auth/student-student-portal.json"),
            },
        },
    ],
});
