import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma, SemesterType } from "@generated/prisma/client";
import { prisma } from "@repositories";

export interface SemesterList {
    id: string;
    name: SemesterType;
    academicYearId: string;
    createdAt: Date;
    academicYear: { id: string; name: string; startYear: number; endYear: number };
}

export const semesterSortableFields = ["id", "name", "createdAt"];
export const semesterFilterableFields = ["name", "academicYearId", "createdAt"];

export function SemesterRepository(tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const select = { id: true, name: true, academicYearId: true, createdAt: true, academicYear: { select: { id: true, name: true, startYear: true, endYear: true } } } as const;
    return {
        semester: db.semester,
        async findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<SemesterList>> {
            const { page, limit, search, sort, sortDirection } = query;
            const finalLimit = Number(limit), finalPage = Number(page);
            if (!semesterSortableFields.includes(sort)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");
            if (!["asc", "desc"].includes(sortDirection)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");
            const conditions: Prisma.SemesterWhereInput[] = [{ academicYear: { instituteId } }];
            if (search) {
                const upper = search.toUpperCase();
                if (Object.values(SemesterType).includes(upper as SemesterType)) conditions.push({ name: upper as SemesterType });
                else conditions.push({ academicYear: { instituteId, name: { contains: search, mode: "insensitive" } } });
            }
            const filter = query.filter;
            if (filter) for (const key of Object.keys(filter)) if (!semesterFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");
            if (filter?.name) conditions.push({ name: filter.name.toString().toUpperCase() as SemesterType });
            if (filter?.academicYearId) conditions.push({ academicYearId: filter.academicYearId.toString() });
            if (filter?.createdAt && typeof filter.createdAt === "string") conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
            const where: Prisma.SemesterWhereInput = { AND: conditions };
            const [totalCount, semesters] = await Promise.all([
                db.semester.count({ where }),
                db.semester.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select }),
            ]);
            return { data: semesters, meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) } };
        },
        async findOne(id: string, instituteId: string): Promise<SemesterList | null> {
            return db.semester.findFirst({ where: { id, academicYear: { instituteId } }, select });
        },
    };
}
