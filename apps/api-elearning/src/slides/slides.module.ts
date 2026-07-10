import { Module } from "@nestjs/common";
import { SlidesController } from "./slides.controller.js";
import { SlidesService } from "./slides.service.js";

@Module({
    controllers: [SlidesController],
    providers: [SlidesService],
    exports: [SlidesService],
})
export class SlidesModule { }
