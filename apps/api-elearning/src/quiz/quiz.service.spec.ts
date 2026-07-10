import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@cerios/database";

import { QuizService } from "./quiz.service.js";

interface QuizServiceInternals {
	buildWordPool(text: string): string[];
	pickDistractors(correctWord: string, wordPool: string[]): string[];
}

function asInternals(service: QuizService): QuizServiceInternals {
	return service as unknown as QuizServiceInternals;
}

function makePrisma(overrides: Record<string, unknown> = {}): PrismaClient {
	return {
		course: {
			findUnique: vi.fn(),
			...(overrides["course"] as Record<string, unknown> | undefined),
		},
		quiz: {
			findUnique: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			...(overrides["quiz"] as Record<string, unknown> | undefined),
		},
		quizAttempt: {
			deleteMany: vi.fn(),
			...(overrides["quizAttempt"] as Record<string, unknown> | undefined),
		},
		quizQuestion: {
			createMany: vi.fn(),
			...(overrides["quizQuestion"] as Record<string, unknown> | undefined),
		},
	} as unknown as PrismaClient;
}

describe("QuizService", () => {
	describe("generateQuiz", () => {
		it("throws NotFoundException when the course does not exist", async () => {
			const findUnique = vi.fn().mockResolvedValue(null);
			const service = new QuizService(makePrisma({ course: { findUnique } }));

			await expect(service.generateQuiz("missing")).rejects.toThrow(NotFoundException);
		});
	});

	describe("buildWordPool", () => {
		it("keeps only real words longer than 4 letters, excluding stop words", () => {
			const service = new QuizService(makePrisma());
			const pool = asInternals(service).buildWordPool(
				"There is a wonderful concept about which we learn today.",
			);

			expect(pool).toContain("wonderful");
			expect(pool).toContain("concept");
			expect(pool).not.toContain("which");
			expect(pool).not.toContain("is");
		});

		it("deduplicates repeated words", () => {
			const service = new QuizService(makePrisma());
			const pool = asInternals(service).buildWordPool("concept concept concept");

			expect(pool).toEqual(["concept"]);
		});
	});

	describe("pickDistractors", () => {
		it("never includes the correct word among the distractors", () => {
			const service = new QuizService(makePrisma());
			const distractors = asInternals(service).pickDistractors("concept", [
				"concept",
				"overview",
				"element",
				"feature",
			]);

			expect(distractors).not.toContain("concept");
		});

		it("falls back to the generic word list when the pool is too small", () => {
			const service = new QuizService(makePrisma());
			const distractors = asInternals(service).pickDistractors("concept", []);

			expect(distractors.length).toBe(3);
			expect(distractors).not.toContain("concept");
		});
	});
});
