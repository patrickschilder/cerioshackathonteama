import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller.js";
import { PptxParserService } from "./pptx-parser.service.js";

@Module({
    controllers: [UploadsController],
    providers: [PptxParserService],
    exports: [PptxParserService],
})
export class UploadsModule { }
