import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SlidesService } from "./slides.service.js";

@Controller("courses/:courseId/slides")
@UseGuards(AuthGuard("jwt"))
export class SlidesController {
    constructor(private readonly slidesService: SlidesService) { }

    @Get()
    findAll(@Param("courseId") courseId: string) {
        return this.slidesService.findByCourse(courseId);
    }

    @Get(":slideId")
    findOne(
        @Param("courseId") courseId: string,
        @Param("slideId") slideId: string,
    ) {
        return this.slidesService.findOne(courseId, slideId);
    }
}
