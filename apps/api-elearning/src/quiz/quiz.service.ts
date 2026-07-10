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

        // Delete old quiz if exists
        await this.prisma.quiz.deleteMany({ where: { courseId } });

        const quiz = await this.prisma.quiz.create({ data: { courseId } });

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
            const generated = this.extractQuestions(slide.rawText, slide.title);
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

        if (!quiz) throw new NotFoundException("Quiz not found — generate it first");

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

    private extractQuestions(
        rawText: string,
        title: string | null,
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
            const stopWords = new Set([
                "this", "that", "with", "from", "have", "been", "they", "their",
                "there", "which", "when", "where", "what", "will", "also", "each",
                "more", "most", "some", "into", "over", "after",
            ]);
            const candidates = words.filter(
                (w) => w.length > 4 && !stopWords.has(w.toLowerCase()),
            );
            if (candidates.length === 0) continue;

            const keyWord = candidates[Math.floor(candidates.length / 2)] ?? candidates[0]!;
            const questionText = sentence.replace(keyWord, "______") + "?";
            const distractors = this.generateDistractors(keyWord);

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

    private generateDistractors(word: string): string[] {
        // Simple distractors: reverse, replace vowels, prefix
        const reversed = word.split("").reverse().join("");
        const noVowels = word.replace(/[aeiou]/gi, "o");
        const prefixed = `un${word}`;
        return [reversed, noVowels, prefixed].filter((d) => d !== word).slice(0, 3);
    }

    private shuffle<T>(arr: T[]): T[] {
        return [...arr].sort(() => Math.random() - 0.5);
    }
}
