import type { QuizDto, QuizResultDto, UserDto } from "@cerios/shared-types";
import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { CurrentUser } from "../common/current-user.decorator.js";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";

import { SubmitQuizDto } from "./quiz.dto.js";
import { QuizService } from "./quiz.service.js";

@Controller("courses/:courseId/quiz")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class QuizController {
	constructor(private readonly quizService: QuizService) {}

	@Post("generate")
	@Roles("INSTRUCTOR", "ADMIN")
	generate(@Param("courseId") courseId: string): Promise<QuizDto> {
		return this.quizService.generateQuiz(courseId);
	}

	@Get()
	getQuiz(@Param("courseId") courseId: string): Promise<QuizDto> {
		return this.quizService.getQuiz(courseId, false);
	}

	@Post("submit")
	@Roles("STUDENT")
	submit(
		@Param("courseId") courseId: string,
		@Body() dto: SubmitQuizDto,
		@CurrentUser() user: UserDto
	): Promise<QuizResultDto> {
		return this.quizService.submitQuiz(courseId, user.id, dto);
	}
}
