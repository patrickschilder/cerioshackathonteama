import type { PrismaClient } from "@cerios/database";
import type { CourseProgressDto } from "@cerios/shared-types";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class ProgressService {
	constructor(@Inject("PRISMA") private readonly prisma: PrismaClient) {}

	async markSlideViewed(userId: string, courseId: string, slideId: string): Promise<void> {
		await this.prisma.progress.upsert({
			where: { userId_slideId: { userId, slideId } },
			update: {},
			create: { userId, slideId },
		});
	}

	async getCourseProgress(userId: string, courseId: string): Promise<CourseProgressDto> {
		const totalSlides = await this.prisma.slide.count({ where: { courseId } });

		const viewedRecords = await this.prisma.progress.findMany({
			where: {
				userId,
				slide: { courseId },
			},
			select: { slideId: true },
		});

		const viewedSlideIds = viewedRecords.map(r => r.slideId);
		const viewedSlides = viewedSlideIds.length;
		const percentage = totalSlides > 0 ? Math.round((viewedSlides / totalSlides) * 100) : 0;

		return {
			courseId,
			totalSlides,
			viewedSlides,
			percentage,
			viewedSlideIds,
		};
	}
}
