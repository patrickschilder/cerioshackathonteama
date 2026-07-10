import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../common/roles.guard.js";
import { Roles } from "../common/roles.decorator.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { SlidesService } from "./slides.service.js";
import { UpdateSlideDto } from "./slides.dto.js";
import type { SlideDto, UserDto } from "@cerios/shared-types";

@Controller("courses/:courseId/slides")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class SlidesController {
    constructor(private readonly slidesService: SlidesService) { }

    @Get()
    findAll(@Param("courseId") courseId: string): Promise<SlideDto[]> {
        return this.slidesService.findByCourse(courseId);
    }

    @Get(":slideId")
    findOne(
        @Param("courseId") courseId: string,
        @Param("slideId") slideId: string,
    ): Promise<SlideDto> {
        return this.slidesService.findOne(courseId, slideId);
    }

    @Patch(":slideId")
    @Roles("INSTRUCTOR", "ADMIN")
    update(
        @Param("courseId") courseId: string,
        @Param("slideId") slideId: string,
        @Body() dto: UpdateSlideDto,
        @CurrentUser() user: UserDto,
    ): Promise<SlideDto> {
        return this.slidesService.update(courseId, slideId, dto, user);
    }
}
