import { describe, expect, it, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@cerios/database";
import type { UserDto } from "@cerios/shared-types";

import { CoursesService } from "./courses.service.js";

function makeUser(overrides: Partial<UserDto> = {}): UserDto {
	return {
		id: "user-1",
		keycloakId: "keycloak-1",
		email: "user@cerios.nl",
		firstName: "Test",
		lastName: "User",
		role: "STUDENT",
		...overrides,
	};
}

function makeCourseRow(overrides: Record<string, unknown> = {}): {
	id: string;
	title: string;
	description: string | null;
	published: boolean;
	instructorId: string;
	createdAt: Date;
	_count: { slides: number };
} {
	return {
		id: "course-1",
		title: "Intro",
		description: null,
		published: false,
		instructorId: "instructor-1",
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		_count: { slides: 2 },
		...overrides,
	};
}

function makePrisma(overrides: Record<string, unknown> = {}): PrismaClient {
	return {
		course: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			...(overrides["course"] as Record<string, unknown> | undefined),
		},
	} as unknown as PrismaClient;
}

describe("CoursesService", () => {
	describe("findAll", () => {
		it("filters to published courses only for a student", async () => {
			const findMany = vi.fn().mockResolvedValue([]);
			const service = new CoursesService(makePrisma({ course: { findMany } }));

			await service.findAll(makeUser({ role: "STUDENT" }));

			expect(findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { published: true } }),
			);
		});

		it("filters to owned courses only for an instructor", async () => {
			const findMany = vi.fn().mockResolvedValue([]);
			const service = new CoursesService(makePrisma({ course: { findMany } }));

			await service.findAll(makeUser({ role: "INSTRUCTOR", id: "instructor-1" }));

			expect(findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { instructorId: "instructor-1" } }),
			);
		});

		it("applies no filter for an admin", async () => {
			const findMany = vi.fn().mockResolvedValue([]);
			const service = new CoursesService(makePrisma({ course: { findMany } }));

			await service.findAll(makeUser({ role: "ADMIN" }));

			expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
		});
	});

	describe("findOne", () => {
		it("throws NotFoundException when the course does not exist", async () => {
			const findUnique = vi.fn().mockResolvedValue(null);
			const service = new CoursesService(makePrisma({ course: { findUnique } }));

			await expect(service.findOne("missing", makeUser())).rejects.toThrow(
				NotFoundException,
			);
		});

		it("throws ForbiddenException when a student requests an unpublished course", async () => {
			const findUnique = vi.fn().mockResolvedValue(makeCourseRow({ published: false }));
			const service = new CoursesService(makePrisma({ course: { findUnique } }));

			await expect(
				service.findOne("course-1", makeUser({ role: "STUDENT" })),
			).rejects.toThrow(ForbiddenException);
		});

		it("throws ForbiddenException when an instructor requests a course they do not own", async () => {
			const findUnique = vi
				.fn()
				.mockResolvedValue(makeCourseRow({ instructorId: "other-instructor" }));
			const service = new CoursesService(makePrisma({ course: { findUnique } }));

			await expect(
				service.findOne("course-1", makeUser({ role: "INSTRUCTOR", id: "instructor-1" })),
			).rejects.toThrow(ForbiddenException);
		});

		it("returns the course for its owning instructor", async () => {
			const findUnique = vi
				.fn()
				.mockResolvedValue(makeCourseRow({ instructorId: "instructor-1" }));
			const service = new CoursesService(makePrisma({ course: { findUnique } }));

			const result = await service.findOne(
				"course-1",
				makeUser({ role: "INSTRUCTOR", id: "instructor-1" }),
			);

			expect(result.id).toBe("course-1");
			expect(result.slideCount).toBe(2);
		});
	});

	describe("remove", () => {
		it("throws NotFoundException when the course does not exist", async () => {
			const findUnique = vi.fn().mockResolvedValue(null);
			const service = new CoursesService(makePrisma({ course: { findUnique } }));

			await expect(service.remove("missing", makeUser({ role: "ADMIN" }))).rejects.toThrow(
				NotFoundException,
			);
		});

		it("throws ForbiddenException when an instructor tries to delete a course they do not own", async () => {
			const findUnique = vi
				.fn()
				.mockResolvedValue(makeCourseRow({ instructorId: "other-instructor" }));
			const service = new CoursesService(makePrisma({ course: { findUnique } }));

			await expect(
				service.remove("course-1", makeUser({ role: "INSTRUCTOR", id: "instructor-1" })),
			).rejects.toThrow(ForbiddenException);
		});
	});
});
