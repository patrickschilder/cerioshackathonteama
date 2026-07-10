import { Global, Module } from "@nestjs/common";
import { prisma } from "@cerios/database";

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
export class DatabaseModule { }
