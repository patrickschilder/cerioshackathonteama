import { IsString, IsOptional, MinLength } from "class-validator";

export class UpdateSlideDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    @MinLength(1)
    rawText?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
