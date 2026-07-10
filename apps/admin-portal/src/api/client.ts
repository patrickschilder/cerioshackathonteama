import keycloak from "../keycloak.js";
import type { CourseDto, CreateCourseDto, UpdateCourseDto, SlideDto, UpdateSlideDto, QuizDto } from "@cerios/shared-types";

const API_BASE = import.meta.env["VITE_API_URL"] ?? "http://localhost:3000";

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Refresh token if about to expire (within 30s)
    await keycloak.updateToken(30).catch(() => keycloak.login());

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token ?? ""}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }

    return response;
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function getCourses(): Promise<CourseDto[]> {
    const r = await authFetch("/courses");
    return r.json() as Promise<CourseDto[]>;
}

export async function getCourse(id: string): Promise<CourseDto> {
    const r = await authFetch(`/courses/${id}`);
    return r.json() as Promise<CourseDto>;
}

export async function createCourse(dto: CreateCourseDto): Promise<CourseDto> {
    const r = await authFetch("/courses", {
        method: "POST",
        body: JSON.stringify(dto),
    });
    return r.json() as Promise<CourseDto>;
}

export async function updateCourse(id: string, dto: UpdateCourseDto): Promise<CourseDto> {
    const r = await authFetch(`/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
    });
    return r.json() as Promise<CourseDto>;
}

export async function deleteCourse(id: string): Promise<void> {
    await authFetch(`/courses/${id}`, { method: "DELETE" });
}

// ─── Slides ─────────────────────────────────────────────────────────────────

export async function getSlides(courseId: string): Promise<SlideDto[]> {
    const r = await authFetch(`/courses/${courseId}/slides`);
    return r.json() as Promise<SlideDto[]>;
}

export async function updateSlide(
    courseId: string,
    slideId: string,
    dto: UpdateSlideDto,
): Promise<SlideDto> {
    const r = await authFetch(`/courses/${courseId}/slides/${slideId}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
    });
    return r.json() as Promise<SlideDto>;
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export async function uploadPptx(
    courseId: string,
    file: File,
): Promise<{ slideCount: number }> {
    await keycloak.updateToken(30).catch(() => keycloak.login());

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/courses/${courseId}/upload/pptx`, {
        method: "POST",
        headers: { Authorization: `Bearer ${keycloak.token ?? ""}` },
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed ${response.status}: ${text}`);
    }

    return response.json() as Promise<{ slideCount: number }>;
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

export async function generateQuiz(courseId: string): Promise<QuizDto> {
    const r = await authFetch(`/courses/${courseId}/quiz/generate`, { method: "POST" });
    return r.json() as Promise<QuizDto>;
}

export async function getQuiz(courseId: string): Promise<QuizDto> {
    const r = await authFetch(`/courses/${courseId}/quiz`);
    return r.json() as Promise<QuizDto>;
}
