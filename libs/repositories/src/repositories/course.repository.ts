import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma } from "@generated/prisma/client";
import { prisma } from "@repositories";

export interface CourseList {
	id: string;
	code: string;
	title: string;
	creditUnits: number;
	instituteId: string;
	departmentId: string;
	department: {
		id: string;
		code: string;
		name: string
	};
	createdAt: Date;
	updatedAt: Date;
}
export const courseSortableFields = ["id", "code", "title", "creditUnits", "createdAt", "updatedAt"];
export const courseFilterableFields = ["code", "title", "creditUnits", "departmentId", "createdAt", "updatedAt"];

export function CourseRepository(tx?: Prisma.TransactionClient) {
	const db = tx ?? prisma;

	const select = {
		id: true,
		code: true,
		title: true,
		creditUnits: true,
		instituteId: true,
		departmentId: true,
		department: { select: { id: true, code: true, name: true } },
		createdAt: true, updatedAt: true
	} as const;

	return {

		course: db.course,

		async findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<CourseList>> {

			const { page, limit, search, sort, sortDirection } = query;
			const finalLimit = Number(limit), finalPage = Number(page);

			if (!courseSortableFields.includes(sort))
				throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");

			if (!["asc", "desc"].includes(sortDirection))
				throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");

			const conditions: Prisma.CourseWhereInput[] = [{ instituteId }];

			if (search)
				conditions.push({
					OR: [
						{ code: { contains: search, mode: "insensitive" } },
						{ title: { contains: search, mode: "insensitive" } },
						{ department: { name: { contains: search, mode: "insensitive" } } }
					]
				});

			const filter = query.filter;
			if (filter)
				for (const key of Object.keys(filter))
					if (!courseFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");

			if (filter?.code)
				conditions.push({ code: { contains: filter.code.toString(), mode: "insensitive" } });
			if (filter?.title)
				conditions.push({ title: { contains: filter.title.toString(), mode: "insensitive" } });
			if (filter?.departmentId)
				conditions.push({ departmentId: filter.departmentId.toString() });
			if (filter?.creditUnits)
				conditions.push({ creditUnits: Number(filter.creditUnits) });
			if (filter?.createdAt && typeof filter.createdAt === "string")
				conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
			if (filter?.updatedAt && typeof filter.updatedAt === "string")
				conditions.push({ updatedAt: parseDateRangeFilter(filter.updatedAt, "updatedAt") });
			const where: Prisma.CourseWhereInput = { AND: conditions };
			const [totalCount, courses] = await Promise.all([db.course.count({ where }), db.course.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select })]);

			return {
				data: courses,
				meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) }
			};
		},
		findOne(id: string, instituteId: string): Promise<CourseList | null> {
			return db.course.findFirst({
				where: { id, instituteId },
				select
			});
		}
	};
}
