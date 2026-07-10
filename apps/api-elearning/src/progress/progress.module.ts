import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";

@Module({
    controllers: [ProgressController],
    providers: [ProgressService],
})
export class ProgressModule { }
