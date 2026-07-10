import { readFileSync } from "fs";
import path from "path";

import { expect, test } from "@playwright/test";

const API_URL = process.env["E2E_API_URL"] ?? "http://localhost:3000";

function readTokens(): { instructor: string; student: string } {
	const raw = readFileSync(path.join(__dirname, "../../.auth/tokens.json"), "utf-8");
	return JSON.parse(raw) as { instructor: string; student: string };
}

test.describe("GET /courses", () => {
	test("rejects unauthenticated requests", async ({ request }) => {
		const response = await request.get(`${API_URL}/courses`);
		expect(response.status()).toBe(401);
	});

	test("returns the instructor's courses for an authenticated instructor", async ({ request }) => {
		const { instructor } = readTokens();

		const response = await request.get(`${API_URL}/courses`, {
			headers: { Authorization: `Bearer ${instructor}` },
		});

		expect(response.ok()).toBeTruthy();
		const courses = (await response.json()) as Array<{ title: string }>;
		expect(Array.isArray(courses)).toBe(true);
	});
});
