import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma } from "@generated/prisma/client";
import { prisma } from "@repositories";

export interface ProgramList {
    id: string;
    code: string;
    name: string;
    instituteId: string;
    departmentId: string;
    department: { id: string; code: string; name: string };
    createdAt: Date;
    updatedAt: Date;
}

export const programSortableFields = ["id", "code", "name", "createdAt", "updatedAt"];
export const programFilterableFields = ["code", "name", "departmentId", "createdAt", "updatedAt"];

export function ProgramRepository(tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const select = {
        id: true, code: true, name: true, instituteId: true, departmentId: true,
        department: { select: { id: true, code: true, name: true } },
        createdAt: true, updatedAt: true,
    } as const;

    return {
        program: db.program,
        async findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<ProgramList>> {
            const { page, limit, search, sort, sortDirection } = query;
            const finalLimit = Number(limit);
            const finalPage = Number(page);
            if (!programSortableFields.includes(sort)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");
            if (!["asc", "desc"].includes(sortDirection)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");

            const conditions: Prisma.ProgramWhereInput[] = [{ instituteId }];
            if (search) conditions.push({
                OR: [
                    { code: { contains: search, mode: "insensitive" } },
                    { name: { contains: search, mode: "insensitive" } },
                    { department: { name: { contains: search, mode: "insensitive" } } },
                ]
            });

            const filter = query.filter;
            if (filter) for (const key of Object.keys(filter)) if (!programFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");
            if (filter?.code) conditions.push({ code: { contains: filter.code.toString(), mode: "insensitive" } });
            if (filter?.name) conditions.push({ name: { contains: filter.name.toString(), mode: "insensitive" } });
            if (filter?.departmentId) conditions.push({ departmentId: filter.departmentId.toString() });
            if (filter?.createdAt && typeof filter.createdAt === "string") conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
            if (filter?.updatedAt && typeof filter.updatedAt === "string") conditions.push({ updatedAt: parseDateRangeFilter(filter.updatedAt, "updatedAt") });

            const where: Prisma.ProgramWhereInput = { AND: conditions };
            const [totalCount, programs] = await Promise.all([
                db.program.count({ where }),
                db.program.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select }),
            ]);
            return { data: programs, meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) } };
        },
        async findOne(id: string, instituteId: string): Promise<ProgramList | null> {
            return db.program.findFirst({ where: { id, instituteId }, select });
        },
    };
}
