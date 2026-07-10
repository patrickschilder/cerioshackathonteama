import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import type { PrismaClient } from "@cerios/database";
import type { SlideDto } from "@cerios/shared-types";

@Injectable()
export class SlidesService {
    constructor(@Inject("PRISMA") private readonly prisma: PrismaClient) { }

    async findByCourse(courseId: string): Promise<SlideDto[]> {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException("Course not found");

        const slides = await this.prisma.slide.findMany({
            where: { courseId },
            orderBy: { index: "asc" },
        });

        return slides.map((s) => ({
            id: s.id,
            index: s.index,
            title: s.title,
            rawText: s.rawText,
            notes: s.notes,
            courseId: s.courseId,
        }));
    }

    async findOne(courseId: string, slideId: string): Promise<SlideDto> {
        const slide = await this.prisma.slide.findFirst({
            where: { id: slideId, courseId },
        });
        if (!slide) throw new NotFoundException("Slide not found");

        return {
            id: slide.id,
            index: slide.index,
            title: slide.title,
            rawText: slide.rawText,
            notes: slide.notes,
            courseId: slide.courseId,
        };
    }
}
