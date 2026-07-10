import { extname, join } from "path";

import { Controller, Post, Param, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";

import { PptxParserService } from "./pptx-parser.service.js";

@Controller("courses/:courseId/upload")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class UploadsController {
	constructor(private readonly pptxParser: PptxParserService) {}

	@Post("pptx")
	@Roles("INSTRUCTOR", "ADMIN")
	@UseInterceptors(
		FileInterceptor("file", {
			storage: diskStorage({
				destination: (_req, _file, cb) => {
					const uploadDir = process.env["UPLOAD_DIR"] ?? join(process.cwd(), "uploads");
					cb(null, uploadDir);
				},
				filename: (_req, file, cb) => {
					const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
					cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
				},
			}),
			limits: {
				fileSize: parseInt(process.env["MAX_FILE_SIZE_MB"] ?? "50", 10) * 1024 * 1024,
			},
			fileFilter: (_req, file, cb) => {
				if (
					file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
					extname(file.originalname).toLowerCase() === ".pptx"
				) {
					cb(null, true);
				} else {
					cb(new BadRequestException("Only .pptx files are allowed"), false);
				}
			},
		})
	)
	async uploadPptx(
		@Param("courseId") courseId: string,
		@UploadedFile() file: Express.Multer.File
	): Promise<{ message: string; slideCount: number; slides: Array<{ index: number; title: string | null }> }> {
		if (!file) {
			throw new BadRequestException("No file uploaded");
		}

		const slides = await this.pptxParser.parseAndStore(courseId, file.path);

		return {
			message: "File uploaded and parsed successfully",
			slideCount: slides.length,
			slides: slides.map(s => ({ index: s.index, title: s.title })),
		};
	}
}
