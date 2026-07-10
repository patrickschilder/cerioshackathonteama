import { Module } from "@nestjs/common";

import { PptxParserService } from "./pptx-parser.service.js";
import { UploadsController } from "./uploads.controller.js";

@Module({
	controllers: [UploadsController],
	providers: [PptxParserService],
	exports: [PptxParserService],
})
export class UploadsModule {}
