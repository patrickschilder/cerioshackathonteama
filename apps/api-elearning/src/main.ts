import "dotenv/config";
import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: [
			"http://localhost:5173", // student portal
			"http://localhost:5174", // admin portal
		],
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	);

	const port = process.env["PORT"] ?? 3000;
	await app.listen(port);
	console.log(`API running on http://localhost:${port}`);
}

void bootstrap();
