import type { Role } from "@cerios/shared-types";
import { SetMetadata, type CustomDecorator } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);
