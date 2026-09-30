import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma } from "@generated/prisma/client";
import { prisma } from "@repositories";

export interface AcademicYearList {
	id: string;
	name: string;
	startYear: number;
	endYear: number;
	instituteId: string;
	createdAt: Date;
}

export const academicYearSortableFields = ["id", "name", "startYear", "endYear", "createdAt"];
export const academicYearFilterableFields = ["name", "startYear", "endYear", "createdAt"];

export function AcademicYearRepository(tx?: Prisma.TransactionClient) {
	const db = tx ?? prisma;
	const select = { id: true, name: true, startYear: true, endYear: true, instituteId: true, createdAt: true } as const;
	return {
		academicYear: db.academicYear,
		async findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<AcademicYearList>> {
			const { page, limit, search, sort, sortDirection } = query;
			const finalLimit = Number(limit), finalPage = Number(page);
			if (!academicYearSortableFields.includes(sort)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");
			if (!["asc", "desc"].includes(sortDirection)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");
			const conditions: Prisma.AcademicYearWhereInput[] = [{ instituteId }];
			if (search) conditions.push({ name: { contains: search, mode: "insensitive" } });
			const filter = query.filter;
			if (filter) for (const key of Object.keys(filter)) if (!academicYearFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");
			if (filter?.name) conditions.push({ name: { contains: filter.name.toString(), mode: "insensitive" } });
			if (filter?.startYear) conditions.push({ startYear: Number(filter.startYear) });
			if (filter?.endYear) conditions.push({ endYear: Number(filter.endYear) });
			if (filter?.createdAt && typeof filter.createdAt === "string") conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
			const where: Prisma.AcademicYearWhereInput = { AND: conditions };
			const [totalCount, academicYears] = await Promise.all([
				db.academicYear.count({ where }),
				db.academicYear.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select }),
			]);
			return { data: academicYears, meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) } };
		},
		async findOne(id: string, instituteId: string): Promise<AcademicYearList | null> {
			return db.academicYear.findFirst({ where: { id, instituteId }, select });
		},
	};
}
