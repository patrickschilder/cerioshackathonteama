import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ProgressService } from "./progress.service.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { UserDto } from "@cerios/shared-types";

@Controller("courses/:courseId/progress")
@UseGuards(AuthGuard("jwt"))
export class ProgressController {
    constructor(private readonly progressService: ProgressService) { }

    @Get()
    getProgress(
        @Param("courseId") courseId: string,
        @CurrentUser() user: UserDto,
    ) {
        return this.progressService.getCourseProgress(user.id, courseId);
    }

    @Post("slides/:slideId/view")
    markViewed(
        @Param("courseId") courseId: string,
        @Param("slideId") slideId: string,
        @CurrentUser() user: UserDto,
    ) {
        return this.progressService.markSlideViewed(user.id, courseId, slideId);
    }
}
