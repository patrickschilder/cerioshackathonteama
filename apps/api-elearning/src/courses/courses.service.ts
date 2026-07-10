import type { PrismaClient } from "@cerios/database";
import type { CourseDto, UserDto } from "@cerios/shared-types";
import { Injectable, NotFoundException, ForbiddenException, Inject } from "@nestjs/common";

import type { CreateCourseDto, UpdateCourseDto } from "./courses.dto.js";

@Injectable()
export class CoursesService {
	constructor(@Inject("PRISMA") private readonly prisma: PrismaClient) {}

	async findAll(user: UserDto): Promise<CourseDto[]> {
		const where =
			user.role === "STUDENT" ? { published: true } : user.role === "INSTRUCTOR" ? { instructorId: user.id } : {}; // admin sees all

		const courses = await this.prisma.course.findMany({
			where,
			include: { _count: { select: { slides: true } } },
			orderBy: { createdAt: "desc" },
		});

		return courses.map(c => ({
			id: c.id,
			title: c.title,
			description: c.description,
			published: c.published,
			instructorId: c.instructorId,
			slideCount: c._count.slides,
			createdAt: c.createdAt.toISOString(),
		}));
	}

	async findOne(id: string, user: UserDto): Promise<CourseDto> {
		const course = await this.prisma.course.findUnique({
			where: { id },
			include: { _count: { select: { slides: true } } },
		});

		if (!course) throw new NotFoundException("Course not found");

		if (user.role === "STUDENT" && !course.published) {
			throw new ForbiddenException("Course is not published");
		}

		if (user.role === "INSTRUCTOR" && course.instructorId !== user.id) {
			throw new ForbiddenException("You do not own this course");
		}

		return {
			id: course.id,
			title: course.title,
			description: course.description,
			published: course.published,
			instructorId: course.instructorId,
			slideCount: course._count.slides,
			createdAt: course.createdAt.toISOString(),
		};
	}

	async create(dto: CreateCourseDto, user: UserDto): Promise<CourseDto> {
		const course = await this.prisma.course.create({
			data: {
				title: dto.title,
				description: dto.description,
				instructorId: user.id,
			},
			include: { _count: { select: { slides: true } } },
		});

		return {
			id: course.id,
			title: course.title,
			description: course.description,
			published: course.published,
			instructorId: course.instructorId,
			slideCount: 0,
			createdAt: course.createdAt.toISOString(),
		};
	}

	async update(id: string, dto: UpdateCourseDto, user: UserDto): Promise<CourseDto> {
		const existing = await this.prisma.course.findUnique({ where: { id } });
		if (!existing) throw new NotFoundException("Course not found");

		if (user.role === "INSTRUCTOR" && existing.instructorId !== user.id) {
			throw new ForbiddenException("You do not own this course");
		}

		const course = await this.prisma.course.update({
			where: { id },
			data: dto,
			include: { _count: { select: { slides: true } } },
		});

		return {
			id: course.id,
			title: course.title,
			description: course.description,
			published: course.published,
			instructorId: course.instructorId,
			slideCount: course._count.slides,
			createdAt: course.createdAt.toISOString(),
		};
	}

	async remove(id: string, user: UserDto): Promise<void> {
		const existing = await this.prisma.course.findUnique({ where: { id } });
		if (!existing) throw new NotFoundException("Course not found");

		if (user.role === "INSTRUCTOR" && existing.instructorId !== user.id) {
			throw new ForbiddenException("You do not own this course");
		}

		await this.prisma.course.delete({ where: { id } });
	}
}
