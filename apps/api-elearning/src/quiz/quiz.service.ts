import {
    Injectable,
    NotFoundException,
    Inject,
} from "@nestjs/common";
import type { PrismaClient } from "@cerios/database";
import type {
    QuizDto,
    QuizQuestionDto,
    QuizResultDto,
    SubmitQuizDto,
} from "@cerios/shared-types";

@Injectable()
export class QuizService {
    constructor(@Inject("PRISMA") private readonly prisma: PrismaClient) { }

    // ─── Generate quiz from slide rawText ─────────────────────────────────────

    async generateQuiz(courseId: string): Promise<QuizDto> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: { slides: { orderBy: { index: "asc" } } },
        });
        if (!course) throw new NotFoundException("Course not found");

        // Delete old quiz if exists (attempts must go first, they FK-reference the quiz)
        const existingQuiz = await this.prisma.quiz.findUnique({ where: { courseId } });
        if (existingQuiz) {
            await this.prisma.quizAttempt.deleteMany({ where: { quizId: existingQuiz.id } });
            await this.prisma.quiz.delete({ where: { id: existingQuiz.id } });
        }

        const quiz = await this.prisma.quiz.create({ data: { courseId } });

        const wordPool = this.buildWordPool(
            course.slides.map((s) => s.rawText).join(" "),
        );

        const questions: Array<{
            quizId: string;
            index: number;
            questionText: string;
            type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
            options: string[];
            correctAnswer: string;
            explanation: string | null;
        }> = [];

        let qi = 0;
        for (const slide of course.slides) {
            const generated = this.extractQuestions(slide.rawText, slide.title, wordPool);
            for (const q of generated) {
                questions.push({ quizId: quiz.id, index: qi++, ...q });
            }
        }

        if (questions.length === 0) {
            // Fallback: one generic question per slide
            for (const [i, slide] of course.slides.entries()) {
                questions.push({
                    quizId: quiz.id,
                    index: i,
                    questionText: `What is the main topic of slide ${i + 1}: "${slide.title ?? "Untitled"}"?`,
                    type: "MULTIPLE_CHOICE",
                    options: [
                        slide.title ?? "Untitled",
                        "Introduction",
                        "Conclusion",
                        "Appendix",
                    ],
                    correctAnswer: slide.title ?? "Untitled",
                    explanation: `This question is about slide ${i + 1}.`,
                });
            }
        }

        await this.prisma.quizQuestion.createMany({
            data: questions.map((q) => ({
                ...q,
                options: q.options,
            })),
        });

        return this.getQuiz(courseId, true);
    }

    async getQuiz(courseId: string, includeAnswers = false): Promise<QuizDto> {
        const quiz = await this.prisma.quiz.findUnique({
            where: { courseId },
            include: {
                questions: { orderBy: { index: "asc" } },
            },
        });

        if (!quiz) {
            // Auto-generate quiz on first access so students don't see an error
            return this.generateQuiz(courseId);
        }

        return {
            id: quiz.id,
            courseId: quiz.courseId,
            questions: quiz.questions.map((q) => ({
                id: q.id,
                index: q.index,
                questionText: q.questionText,
                type: q.type as QuizQuestionDto["type"],
                options: q.options as string[],
                correctAnswer: includeAnswers ? q.correctAnswer : undefined,
                explanation: q.explanation,
            })),
        };
    }

    async submitQuiz(
        courseId: string,
        userId: string,
        dto: SubmitQuizDto,
    ): Promise<QuizResultDto> {
        const quiz = await this.prisma.quiz.findUnique({
            where: { courseId },
            include: { questions: true },
        });
        if (!quiz) throw new NotFoundException("Quiz not found");

        let score = 0;
        const feedback: QuizResultDto["feedback"] = [];

        for (const question of quiz.questions) {
            const given = dto.answers[question.id];
            const correct = given === question.correctAnswer;
            if (correct) score++;
            feedback.push({
                questionId: question.id,
                correct,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
            });
        }

        const totalPoints = quiz.questions.length;
        const percentage =
            totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const status =
            percentage >= 60 ? ("PASSED" as const) : ("FAILED" as const);

        const attempt = await this.prisma.quizAttempt.create({
            data: {
                userId,
                quizId: quiz.id,
                score,
                totalPoints,
                answers: dto.answers,
                status,
            },
        });

        return {
            attemptId: attempt.id,
            score,
            totalPoints,
            percentage,
            status,
            feedback,
        };
    }

    // ─── Heuristic question extraction ────────────────────────────────────────

    private static readonly STOP_WORDS = new Set([
        "this", "that", "with", "from", "have", "been", "they", "their",
        "there", "which", "when", "where", "what", "will", "also", "each",
        "more", "most", "some", "into", "over", "after",
    ]);

    private extractQuestions(
        rawText: string,
        title: string | null,
        wordPool: string[],
    ): Array<{
        questionText: string;
        type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
        options: string[];
        correctAnswer: string;
        explanation: string | null;
    }> {
        const result: ReturnType<QuizService["extractQuestions"]> = [];
        const sentences = rawText
            .split(/[.!]\s+/)
            .map((s) => s.trim())
            .filter((s) => s.split(" ").length >= 5 && s.split(" ").length <= 25);

        for (const sentence of sentences.slice(0, 2)) {
            const words = sentence.split(" ");
            // Pick a "key" word (noun-ish: >4 chars, not a stop word)
            const candidates = words.filter(
                (w) => w.length > 4 && !QuizService.STOP_WORDS.has(w.toLowerCase()),
            );
            if (candidates.length === 0) continue;

            const keyWord = candidates[Math.floor(candidates.length / 2)] ?? candidates[0];
            const questionText = sentence.replace(keyWord, "______") + "?";
            const distractors = this.pickDistractors(keyWord, wordPool);

            result.push({
                questionText: `Fill in the blank: "${questionText}"`,
                type: "MULTIPLE_CHOICE",
                options: this.shuffle([keyWord, ...distractors]),
                correctAnswer: keyWord,
                explanation: `The correct answer comes from: "${sentence}"`,
            });
        }

        // Add a true/false for the slide title if available
        if (title && title.length > 3) {
            result.push({
                questionText: `True or False: "${title}" is a topic covered in this course.`,
                type: "TRUE_FALSE",
                options: ["True", "False"],
                correctAnswer: "True",
                explanation: `This slide is titled "${title}".`,
            });
        }

        return result;
    }

    /**
     * Build a pool of real, properly-spelled candidate words from the course
     * material so distractors look like plausible answers instead of garbled
     * text (which previously made the correct answer obvious by being the
     * only normally-spelled option).
     */
    private buildWordPool(text: string): string[] {
        const words = text
            .split(/\s+/)
            .map((w) => w.replace(/[^a-zA-Z]/g, ""))
            .filter((w) => w.length > 4 && !QuizService.STOP_WORDS.has(w.toLowerCase()));
        return Array.from(new Set(words));
    }

    private pickDistractors(correctWord: string, wordPool: string[]): string[] {
        const fallbackPool = [
            "Concept", "Overview", "Summary", "Detail", "Example", "Process",
            "Method", "Structure", "Element", "Feature",
        ];
        const candidates = wordPool.filter(
            (w) => w.toLowerCase() !== correctWord.toLowerCase(),
        );
        const distractors = this.shuffle(candidates).slice(0, 3);

        for (const fallback of fallbackPool) {
            if (distractors.length >= 3) break;
            const alreadyUsed = distractors.some(
                (d) => d.toLowerCase() === fallback.toLowerCase(),
            );
            if (!alreadyUsed && fallback.toLowerCase() !== correctWord.toLowerCase()) {
                distractors.push(fallback);
            }
        }

        return distractors;
    }

    private shuffle<T>(arr: T[]): T[] {
        return [...arr].sort(() => Math.random() - 0.5);
    }
}
