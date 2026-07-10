import type { PrismaClient } from "@cerios/database";
import type { UserDto, Role } from "@cerios/shared-types";
import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { passportJwtSecret } from "jwks-rsa";
import { ExtractJwt, Strategy } from "passport-jwt";

interface KeycloakJwtPayload {
	sub: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	realm_access?: { roles?: string[] };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(@Inject("PRISMA") private readonly prisma: PrismaClient) {
		const realmUrl = process.env["KEYCLOAK_REALM_URL"] ?? "http://localhost:8080/realms/elearning";

		super({
			secretOrKeyProvider: passportJwtSecret({
				cache: true,
				rateLimit: true,
				jwksRequestsPerMinute: 5,
				jwksUri: `${realmUrl}/protocol/openid-connect/certs`,
			}),
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			audience: "api-elearning",
			issuer: realmUrl,
			algorithms: ["RS256"],
		});
	}

	async validate(payload: KeycloakJwtPayload): Promise<UserDto> {
		const realmRoles = payload.realm_access?.roles ?? [];
		const role = this.mapKeycloakRole(realmRoles);
		const email = payload.email ?? "";

		// Reconcile the DB record with Keycloak, keyed by keycloakId first,
		// falling back to email (e.g. for rows seeded with a placeholder
		// keycloakId before the real Keycloak subject was known).
		const existing =
			(await this.prisma.user.findUnique({ where: { keycloakId: payload.sub } })) ??
			(email ? await this.prisma.user.findUnique({ where: { email } }) : null);

		const data = {
			keycloakId: payload.sub,
			email,
			firstName: payload.given_name ?? "",
			lastName: payload.family_name ?? "",
			role,
		};

		const user = existing
			? await this.prisma.user.update({ where: { id: existing.id }, data })
			: await this.prisma.user.create({ data });

		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		return {
			id: user.id,
			keycloakId: user.keycloakId,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
		};
	}

	private mapKeycloakRole(roles: string[]): Role {
		if (roles.includes("admin")) return "ADMIN";
		if (roles.includes("instructor")) return "INSTRUCTOR";
		return "STUDENT";
	}
}
