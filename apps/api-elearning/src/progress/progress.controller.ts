import type { CourseProgressDto, UserDto } from "@cerios/shared-types";
import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { CurrentUser } from "../common/current-user.decorator.js";

import { ProgressService } from "./progress.service.js";

@Controller("courses/:courseId/progress")
@UseGuards(AuthGuard("jwt"))
export class ProgressController {
	constructor(private readonly progressService: ProgressService) {}

	@Get()
	getProgress(@Param("courseId") courseId: string, @CurrentUser() user: UserDto): Promise<CourseProgressDto> {
		return this.progressService.getCourseProgress(user.id, courseId);
	}

	@Post("slides/:slideId/view")
	markViewed(
		@Param("courseId") courseId: string,
		@Param("slideId") slideId: string,
		@CurrentUser() user: UserDto
	): Promise<void> {
		return this.progressService.markSlideViewed(user.id, courseId, slideId);
	}
}
