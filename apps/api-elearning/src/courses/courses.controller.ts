import type { CourseDto, UserDto } from "@cerios/shared-types";
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { CurrentUser } from "../common/current-user.decorator.js";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";

import { CreateCourseDto, UpdateCourseDto } from "./courses.dto.js";
import { CoursesService } from "./courses.service.js";

@Controller("courses")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class CoursesController {
	constructor(private readonly coursesService: CoursesService) {}

	@Get()
	findAll(@CurrentUser() user: UserDto): Promise<CourseDto[]> {
		return this.coursesService.findAll(user);
	}

	@Get(":id")
	findOne(@Param("id") id: string, @CurrentUser() user: UserDto): Promise<CourseDto> {
		return this.coursesService.findOne(id, user);
	}

	@Post()
	@Roles("INSTRUCTOR", "ADMIN")
	create(@Body() dto: CreateCourseDto, @CurrentUser() user: UserDto): Promise<CourseDto> {
		return this.coursesService.create(dto, user);
	}

	@Patch(":id")
	@Roles("INSTRUCTOR", "ADMIN")
	update(@Param("id") id: string, @Body() dto: UpdateCourseDto, @CurrentUser() user: UserDto): Promise<CourseDto> {
		return this.coursesService.update(id, dto, user);
	}

	@Delete(":id")
	@Roles("INSTRUCTOR", "ADMIN")
	remove(@Param("id") id: string, @CurrentUser() user: UserDto): Promise<void> {
		return this.coursesService.remove(id, user);
	}
}
