import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma } from "@generated/prisma/client";
import { BadRequestException } from "@nestjs/common";
import { prisma } from "@repositories";
import { I18nContext } from "nestjs-i18n";

export interface InstituteList { id: string; code: string; name: string; type: string; status: string; email: string | null; phone: string | null; country: string | null; state: string | null; city: string | null; createdAt: Date; updatedAt: Date; }
export const instituteSortableFields = ["id", "code", "name", "type", "status", "createdAt", "updatedAt"];
export const instituteFilterableFields = ["code", "name", "type", "status", "createdAt", "updatedAt"];

export function InstituteRepository(tx?: Prisma.TransactionClient) {
	const db = tx ?? prisma;
	return {
		institute: db.institute,
		async findAll(query: DatatableType): Promise<PaginationResponse<InstituteList>> {
			const { page, limit, search, sort, sortDirection } = query;
			const finalLimit = Number(limit); const finalPage = Number(page);
			if (!instituteSortableFields.includes(sort)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");
			if (!["asc", "desc"].includes(sortDirection)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");
			const conditions: Prisma.InstituteWhereInput[] = [{ deletedAt: null }];
			if (search) conditions.push({ OR: [{ code: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] });
			const filter = query.filter;
			if (filter) for (const key of Object.keys(filter)) if (!instituteFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");
			if (filter?.code) conditions.push({ code: { contains: filter.code.toString(), mode: "insensitive" } });
			if (filter?.name) conditions.push({ name: { contains: filter.name.toString(), mode: "insensitive" } });
			if (filter?.type) conditions.push({ type: filter.type.toString() as any });
			if (filter?.status) conditions.push({ status: filter.status.toString() as any });
			if (filter?.createdAt && typeof filter.createdAt === "string") conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
			if (filter?.updatedAt && typeof filter.updatedAt === "string") conditions.push({ updatedAt: parseDateRangeFilter(filter.updatedAt, "updatedAt") });
			const where: Prisma.InstituteWhereInput = { AND: conditions };
			const [totalCount, institutes] = await Promise.all([db.institute.count({ where }), db.institute.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select: { id: true, code: true, name: true, type: true, status: true, email: true, phone: true, country: true, state: true, city: true, createdAt: true, updatedAt: true } })]);
			return { data: institutes, meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) } };
		},
		async findOne(id: string): Promise<InstituteList | null> {
			return db.institute.findFirst({ where: { id, deletedAt: null }, select: { id: true, code: true, name: true, type: true, status: true, email: true, phone: true, country: true, state: true, city: true, createdAt: true, updatedAt: true } });
		},
	};
}
