import type { UserDto } from "@cerios/shared-types";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { CurrentUser } from "../common/current-user.decorator.js";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
	@Get("me")
	getMe(@CurrentUser() user: UserDto): UserDto {
		return user;
	}
}
