import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma } from "@generated/prisma/client";
import { prisma } from "@repositories";

export interface DepartmentList {
    id: string;
    code: string;
    name: string;
    instituteId: string;
    createdAt: Date;
    updatedAt: Date;
}

export const departmentSortableFields = ["id", "code", "name", "createdAt", "updatedAt"];
export const departmentFilterableFields = ["code", "name", "createdAt", "updatedAt"];

export function DepartmentRepository(tx?: Prisma.TransactionClient) {

    const db = tx ?? prisma;

    return {
        department: db.department,
        async findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<DepartmentList>> {
            const { page, limit, search, sort, sortDirection } = query;
            const finalLimit = Number(limit);
            const finalPage = Number(page);
            if (!departmentSortableFields.includes(sort)) {
                throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");
            }
            if (!["asc", "desc"].includes(sortDirection)) {
                throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");
            }
            const conditions: Prisma.DepartmentWhereInput[] = [{ instituteId }];
            if (search) {

                conditions.push({
                    OR:
                        [
                            { code: { contains: search, mode: "insensitive" } },
                            { name: { contains: search, mode: "insensitive" } }
                        ]
                });

            }
            const filter = query.filter;
            if (filter) for (const key of Object.keys(filter)) if (!departmentFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");
            if (filter?.code) conditions.push({ code: { contains: filter.code.toString(), mode: "insensitive" } });
            if (filter?.name) conditions.push({ name: { contains: filter.name.toString(), mode: "insensitive" } });
            if (filter?.createdAt && typeof filter.createdAt === "string") conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
            if (filter?.updatedAt && typeof filter.updatedAt === "string") conditions.push({ updatedAt: parseDateRangeFilter(filter.updatedAt, "updatedAt") });


            const where: Prisma.DepartmentWhereInput = { AND: conditions };
            const select = { id: true, code: true, name: true, instituteId: true, createdAt: true, updatedAt: true } as const;
            const [totalCount, departments] = await Promise.all([
                db.department.count({ where }),
                db.department.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select }),
            ]);
            return { data: departments, meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) } };
        },

        async findOne(id: string, instituteId: string): Promise<DepartmentList | null> {
            return db.department.findFirst({
                where: { id, instituteId },
                select: { id: true, code: true, name: true, instituteId: true, createdAt: true, updatedAt: true },
            });
        },

    }

}
