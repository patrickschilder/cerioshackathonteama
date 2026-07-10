import { Module } from "@nestjs/common";

import { QuizController } from "./quiz.controller.js";
import { QuizService } from "./quiz.service.js";

@Module({
	controllers: [QuizController],
	providers: [QuizService],
})
export class QuizModule {}
