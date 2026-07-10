import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import type { PrismaClient } from "@cerios/database";
import type { UserDto, Role } from "@cerios/shared-types";

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
        const realmUrl =
            process.env["KEYCLOAK_REALM_URL"] ??
            "http://localhost:8080/realms/elearning";

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

        // Upsert the user record so the DB stays in sync with Keycloak
        const user = await this.prisma.user.upsert({
            where: { keycloakId: payload.sub },
            update: {
                email: payload.email ?? "",
                firstName: payload.given_name ?? "",
                lastName: payload.family_name ?? "",
                role,
            },
            create: {
                keycloakId: payload.sub,
                email: payload.email ?? "",
                firstName: payload.given_name ?? "",
                lastName: payload.family_name ?? "",
                role,
            },
        });

        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        return {
            id: user.id,
            keycloakId: user.keycloakId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as Role,
        };
    }

    private mapKeycloakRole(roles: string[]): Role {
        if (roles.includes("admin")) return "ADMIN";
        if (roles.includes("instructor")) return "INSTRUCTOR";
        return "STUDENT";
    }
}
