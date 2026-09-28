import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserInformation } from "@repositories";
import { FastifyRequest } from "fastify";
import { I18nContext } from "nestjs-i18n";

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(private reflector: Reflector) { }
	canActivate(context: ExecutionContext): boolean {
		const requiredPermissions = this.reflector.getAllAndOverride<string[]>("permissions", [context.getHandler(), context.getClass()]);
		if (!requiredPermissions) return true;
		const request = context.switchToHttp().getRequest<FastifyRequest>();
		const user = request.user as UserInformation;
		if (!user) throw new ForbiddenException(I18nContext.current()?.t("message.common.access_denied") ?? "Access denied");
		if (user.platformRoles?.some((role) => role.name === "SUPER_ADMIN")) return true;
		const instituteRoles = request.instituteId
			? user.memberships?.find((m) => m.instituteId === request.instituteId)?.roles ?? []
			: user.roles ?? [];
		const permissions = new Set(instituteRoles.flatMap((role) => role.permissions));
		if (requiredPermissions.every((permission) => permissions.has(permission))) return true;
		throw new ForbiddenException(I18nContext.current()?.t("message.common.insufficient_permission") ?? "Insufficient permissions");
	}
}
