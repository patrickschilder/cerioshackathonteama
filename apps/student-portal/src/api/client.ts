import type {
	CourseDto,
	SlideDto,
	QuizDto,
	SubmitQuizDto,
	QuizResultDto,
	CourseProgressDto,
} from "@cerios/shared-types";

import keycloak from "../keycloak.js";

const API_BASE = import.meta.env["VITE_API_URL"] ?? "http://localhost:3000";

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
	await keycloak.updateToken(30).catch(() => keycloak.login());

	const headers = new Headers(options.headers);
	headers.set("Content-Type", "application/json");
	headers.set("Authorization", `Bearer ${keycloak.token ?? ""}`);

	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`API error ${response.status}: ${text}`);
	}

	return response;
}

export async function getCourses(): Promise<CourseDto[]> {
	const r = await authFetch("/courses");
	return r.json() as Promise<CourseDto[]>;
}

export async function getCourse(id: string): Promise<CourseDto> {
	const r = await authFetch(`/courses/${id}`);
	return r.json() as Promise<CourseDto>;
}

export async function getSlides(courseId: string): Promise<SlideDto[]> {
	const r = await authFetch(`/courses/${courseId}/slides`);
	return r.json() as Promise<SlideDto[]>;
}

export async function getProgress(courseId: string): Promise<CourseProgressDto> {
	const r = await authFetch(`/courses/${courseId}/progress`);
	return r.json() as Promise<CourseProgressDto>;
}

export async function markSlideViewed(courseId: string, slideId: string): Promise<void> {
	await authFetch(`/courses/${courseId}/progress/slides/${slideId}/view`, { method: "POST" });
}

export async function getQuiz(courseId: string): Promise<QuizDto> {
	const r = await authFetch(`/courses/${courseId}/quiz`);
	return r.json() as Promise<QuizDto>;
}

export async function submitQuiz(courseId: string, dto: SubmitQuizDto): Promise<QuizResultDto> {
	const r = await authFetch(`/courses/${courseId}/quiz/submit`, {
		method: "POST",
		body: JSON.stringify(dto),
	});
	return r.json() as Promise<QuizResultDto>;
}
