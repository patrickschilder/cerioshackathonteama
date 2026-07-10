// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export type QuizStatus = "COMPLETED" | "PASSED" | "FAILED";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserDto {
    id: string;
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface CourseDto {
    id: string;
    title: string;
    description: string | null;
    published: boolean;
    instructorId: string;
    slideCount: number;
    createdAt: string;
}

export interface CreateCourseDto {
    title: string;
    description?: string;
}

export interface UpdateCourseDto {
    title?: string;
    description?: string;
    published?: boolean;
}

// ─── Slide ────────────────────────────────────────────────────────────────────

export interface SlideDto {
    id: string;
    index: number;
    title: string | null;
    rawText: string;
    notes: string | null;
    courseId: string;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestionDto {
    id: string;
    index: number;
    questionText: string;
    type: QuestionType;
    options: string[];
    // correctAnswer is omitted in student-facing response; included in admin view
    correctAnswer?: string;
    explanation: string | null;
}

export interface QuizDto {
    id: string;
    courseId: string;
    questions: QuizQuestionDto[];
}

export interface SubmitQuizDto {
    answers: Record<string, string>; // questionId → chosen answer
}

export interface QuizResultDto {
    attemptId: string;
    score: number;
    totalPoints: number;
    percentage: number;
    status: QuizStatus;
    feedback: Array<{
        questionId: string;
        correct: boolean;
        correctAnswer: string;
        explanation: string | null;
    }>;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface CourseProgressDto {
    courseId: string;
    totalSlides: number;
    viewedSlides: number;
    percentage: number;
    viewedSlideIds: string[];
}

export interface MarkSlideViewedDto {
    courseId: string;
    slideId: string;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface EnrollmentDto {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: string;
}
