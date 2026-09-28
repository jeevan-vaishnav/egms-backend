import { createParamDecorator, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { I18nContext } from "nestjs-i18n";

export const CurrentInstituteId = createParamDecorator(
	(_data: unknown, context: ExecutionContext): string => {
		const request = context.switchToHttp().getRequest<FastifyRequest>();
		if (!request.instituteId) {
			throw new ForbiddenException(
				I18nContext.current()?.t("message.common.institute_context_required") ??
					"Institute context is required",
			);
		}
		return request.instituteId;
	},
);
