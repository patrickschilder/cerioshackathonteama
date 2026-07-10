import { IsString, IsOptional, MinLength } from "class-validator";

export class CreateCourseDto {
	@IsString()
	@MinLength(3)
	title!: string;

	@IsString()
	@IsOptional()
	description?: string;
}

export class UpdateCourseDto {
	@IsString()
	@MinLength(3)
	@IsOptional()
	title?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsOptional()
	published?: boolean;
}
