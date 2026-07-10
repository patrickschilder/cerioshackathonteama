import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { DatabaseModule } from "./common/database.module.js";
import { CoursesModule } from "./courses/courses.module.js";
import { ProgressModule } from "./progress/progress.module.js";
import { QuizModule } from "./quiz/quiz.module.js";
import { SlidesModule } from "./slides/slides.module.js";
import { UploadsModule } from "./uploads/uploads.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
	imports: [
		DatabaseModule,
		AuthModule,
		UsersModule,
		CoursesModule,
		SlidesModule,
		UploadsModule,
		QuizModule,
		ProgressModule,
	],
})
export class AppModule {}
