import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import officeParser from "officeparser";
import type { PrismaClient } from "@cerios/database";

export interface ParsedSlide {
    index: number;
    title: string | null;
    rawText: string;
    notes: string | null;
}

@Injectable()
export class PptxParserService {
    constructor(@Inject("PRISMA") private readonly prisma: PrismaClient) { }

    getUploadDir(): string {
        const uploadDir =
            process.env["UPLOAD_DIR"] ?? join(process.cwd(), "uploads");
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
        return uploadDir;
    }

    async parseAndStore(
        courseId: string,
        filePath: string,
    ): Promise<ParsedSlide[]> {
        // Delete existing slides for this course to allow re-upload
        await this.prisma.slide.deleteMany({ where: { courseId } });

        let rawText: string;
        try {
            rawText = await officeParser.parseOfficeAsync(filePath);
        } catch (err) {
            throw new BadRequestException(
                `Failed to parse PowerPoint file: ${String(err)}`,
            );
        }

        // officeparser returns a single text blob; split by double-newlines as a
        // heuristic for slide boundaries (each slide's text is separated by \n\n)
        const slideBlocks = rawText
            .split(/\n{2,}/)
            .map((block) => block.trim())
            .filter((block) => block.length > 0);

        const slides: ParsedSlide[] = slideBlocks.map((block, index) => {
            const lines = block.split("\n").filter((l) => l.trim().length > 0);
            const title = lines.length > 0 ? (lines[0] ?? null) : null;
            return {
                index,
                title,
                rawText: block,
                notes: null,
            };
        });

        // Persist slides
        await this.prisma.slide.createMany({
            data: slides.map((s) => ({ ...s, courseId })),
        });

        return slides;
    }
}
