import { prisma } from "@cerios/database";
import { Global, Module } from "@nestjs/common";

@Global()
@Module({
	providers: [
		{
			provide: "PRISMA",
			useValue: prisma,
		},
	],
	exports: ["PRISMA"],
})
export class DatabaseModule {}
