import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { UserInformation } from "@repositories";
import { I18nContext } from "nestjs-i18n";

export const TENANT_REQUIRED_KEY = "tenant_required";

@Injectable()
export class TenantGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<boolean>(TENANT_REQUIRED_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!required) return true;

		const request = context.switchToHttp().getRequest<FastifyRequest>();
		const user = request.user as UserInformation;
		const instituteIdHeader = request.headers["x-institute-id"];
		const instituteId = Array.isArray(instituteIdHeader)
			? instituteIdHeader[0]
			: instituteIdHeader;

		if (!instituteId) {
			throw new ForbiddenException(
				I18nContext.current()?.t("message.common.institute_context_required") ??
					"Institute context is required. Send x-institute-id.",
			);
		}

		const isSuperAdmin = user?.platformRoles?.some(
			(role) => role.name === "SUPER_ADMIN",
		);

		if (!isSuperAdmin) {
			const membership = user?.memberships?.find(
				(item) => item.instituteId === instituteId && item.status === "ACTIVE",
			);

			if (!membership) {
				throw new ForbiddenException(
					I18nContext.current()?.t("message.common.institute_access_denied") ??
						"You do not have access to this institute",
				);
			}
		}

		request.instituteId = instituteId;
		return true;
	}
}
