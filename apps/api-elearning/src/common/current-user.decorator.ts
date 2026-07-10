import type { UserDto } from "@cerios/shared-types";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserDto => {
	const request = ctx.switchToHttp().getRequest<{ user: UserDto }>();
	return request.user;
});
