import { chromium, request as playwrightRequest } from "@playwright/test";
import type { FullConfig } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const KEYCLOAK_URL = process.env["E2E_KEYCLOAK_URL"] ?? "http://localhost:8080";
const REALM = "elearning";
const ADMIN_PORTAL_URL = process.env["E2E_ADMIN_PORTAL_URL"] ?? "http://localhost:5174";
const STUDENT_PORTAL_URL = process.env["E2E_STUDENT_PORTAL_URL"] ?? "http://localhost:5173";

const AUTH_DIR = path.join(__dirname, ".auth");

interface Credentials {
    username: string;
    password: string;
}

const INSTRUCTOR: Credentials = { username: "instructor-user", password: "instructor123" };
const STUDENT: Credentials = { username: "student-user", password: "student123" };

// Fetches a bearer token directly from Keycloak's token endpoint (Resource
// Owner Password Credentials grant) so API-level tests don't need to drive a
// browser through the login form. Requires `directAccessGrantsEnabled: true`
// on the relevant client in keycloak/realm-export.json (dev realm only).
async function fetchToken(clientId: string, creds: Credentials): Promise<string> {
    const context = await playwrightRequest.newContext();
    try {
        const response = await context.post(
            `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
            {
                form: {
                    grant_type: "password",
                    client_id: clientId,
                    username: creds.username,
                    password: creds.password,
                },
            },
        );
        if (!response.ok()) {
            throw new Error(
                `Failed to fetch token for ${creds.username} (client ${clientId}): ${response.status()} ${await response.text()}`,
            );
        }
        const body = (await response.json()) as { access_token: string };
        return body.access_token;
    } finally {
        await context.dispose();
    }
}

// Drives the real Keycloak-hosted login form once per role/portal and saves
// the resulting browser storage state (cookies + localStorage), so frontend
// E2E tests can start already authenticated instead of repeating the login
// flow in every test.
async function saveLoginStorageState(
    portalUrl: string,
    creds: Credentials,
    outFile: string,
): Promise<void> {
    const browser = await chromium.launch();
    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(portalUrl);
        await page.locator("#username").fill(creds.username);
        await page.locator("#password").fill(creds.password);
        await page.locator("#kc-login").click();
        await page.waitForURL(`${portalUrl}/**`);

        await context.storageState({ path: outFile });
    } finally {
        await browser.close();
    }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
    mkdirSync(AUTH_DIR, { recursive: true });

    const [instructorToken, studentToken] = await Promise.all([
        fetchToken("admin-portal", INSTRUCTOR),
        fetchToken("student-portal", STUDENT),
    ]);

    writeFileSync(
        path.join(AUTH_DIR, "tokens.json"),
        JSON.stringify({ instructor: instructorToken, student: studentToken }, null, 2),
    );

    await saveLoginStorageState(
        ADMIN_PORTAL_URL,
        INSTRUCTOR,
        path.join(AUTH_DIR, "instructor-admin-portal.json"),
    );
    await saveLoginStorageState(
        STUDENT_PORTAL_URL,
        STUDENT,
        path.join(AUTH_DIR, "student-student-portal.json"),
    );
}
