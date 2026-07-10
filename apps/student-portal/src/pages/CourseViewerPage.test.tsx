import type { CourseDto, SlideDto, CourseProgressDto } from "@cerios/shared-types";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { CourseViewerPage } from "./CourseViewerPage.js";

const course: CourseDto = {
	id: "course-1",
	title: "Omnext: Software Quality Analysis",
	description: null,
	published: true,
	instructorId: "instructor-1",
	slideCount: 4,
	createdAt: new Date().toISOString(),
};

const slides: SlideDto[] = [1, 2, 3, 4].map(n => ({
	id: `slide-${n}`,
	index: n - 1,
	title: `Slide ${n}`,
	rawText: `Content ${n}`,
	notes: null,
	courseId: course.id,
}));

const getCourse = vi.fn<(id: string) => Promise<CourseDto>>();
const getSlides = vi.fn<(courseId: string) => Promise<SlideDto[]>>();
const getProgress = vi.fn<(courseId: string) => Promise<CourseProgressDto>>();
const markSlideViewed = vi.fn<(courseId: string, slideId: string) => Promise<void>>();

vi.mock("../api/client.js", () => ({
	getCourse: (id: string): Promise<CourseDto> => getCourse(id),
	getSlides: (id: string): Promise<SlideDto[]> => getSlides(id),
	getProgress: (id: string): Promise<CourseProgressDto> => getProgress(id),
	markSlideViewed: (courseId: string, slideId: string): Promise<void> => markSlideViewed(courseId, slideId),
}));

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
	return {
		...actual,
		useParams: (): { id: string } => ({ id: course.id }),
		useNavigate: (): (() => void) => vi.fn<() => void>(),
	};
});

function renderPage(): ReturnType<typeof render> {
	// React.StrictMode intentionally double-invokes effects in development, which is what
	// exposed the double-counting regression this test guards against.
	return render(
		<React.StrictMode>
			<MemoryRouter>
				<CourseViewerPage />
			</MemoryRouter>
		</React.StrictMode>
	);
}

describe("CourseViewerPage — progress tracking", () => {
	beforeEach(() => {
		getCourse.mockReset().mockResolvedValue(course);
		getSlides.mockReset().mockResolvedValue(slides);
		getProgress.mockReset().mockResolvedValue({
			courseId: course.id,
			totalSlides: 4,
			viewedSlides: 0,
			percentage: 0,
			viewedSlideIds: [],
		});
		markSlideViewed.mockReset().mockResolvedValue(undefined);
	});

	it("shows 25% (not 50%) after viewing only the first of 4 slides, even under StrictMode double-invoked effects", async () => {
		renderPage();

		await waitFor(() => {
			expect(screen.getByText("25% voltooid")).toBeInTheDocument();
		});

		expect(screen.queryByText("50% voltooid")).not.toBeInTheDocument();
		// Guards against the regression where StrictMode's double effect invocation caused
		// the API call (and the optimistic progress state update) to fire twice for one slide.
		expect(markSlideViewed).toHaveBeenCalledTimes(1);
		expect(markSlideViewed).toHaveBeenCalledWith(course.id, "slide-1");
	});

	it("increments to 50% (not 75%) after navigating to the second slide", async () => {
		renderPage();

		await waitFor(() => {
			expect(screen.getByText("25% voltooid")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Volgende →"));

		await waitFor(() => {
			expect(screen.getByText("50% voltooid")).toBeInTheDocument();
		});

		expect(screen.queryByText("75% voltooid")).not.toBeInTheDocument();
		expect(markSlideViewed).toHaveBeenCalledTimes(2);
	});
});
