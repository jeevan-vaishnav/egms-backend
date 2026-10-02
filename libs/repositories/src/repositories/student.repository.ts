import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { DatatableType, PaginationResponse, parseDateRangeFilter } from "@common";
import { Prisma } from "@generated/prisma/client";
import { prisma } from "@repositories";

export interface StudentList {
  id: string;
  userId: string;
  instituteId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  programId: string;
  user: {
    id: string;
    email: string;
    name: string
  };
  program: {
    id: string;
    code: string;
    name: string;
    department:
    {
      id: string;
      code: string;
      name: string
    }
  };
  createdAt: Date;
  updatedAt: Date;
}
export const studentSortableFields = ["id", "studentNumber", "firstName", "lastName", "createdAt", "updatedAt"];
export const studentFilterableFields = ["studentNumber", "firstName", "lastName", "programId", "createdAt", "updatedAt"];

export function StudentRepository(tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  const select = {
    id: true,
    userId: true,
    instituteId: true,
    studentNumber: true,
    firstName: true,
    lastName: true,
    programId: true,
    user: {
      select:
      {
        id: true,
        email: true,
        name: true
      }
    },
    program: {
      select: {
        id: true,
        code: true,
        name: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    },
    createdAt: true,
    updatedAt: true
  } as const;

  return {
    student: db.student,

    async findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<StudentList>> {
      const { page, limit, search, sort, sortDirection } = query;
      const finalLimit = Number(limit), finalPage = Number(page);

      if (!studentSortableFields.includes(sort))
        throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_field") ?? "Invalid sort field");

      if (!["asc", "desc"].includes(sortDirection))
        throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_sort_direction") ?? "Invalid sort direction");

      const conditions: Prisma.StudentWhereInput[] = [{ instituteId }];

      if (search)
        conditions.push({
          OR: [
            { studentNumber: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { program: { name: { contains: search, mode: "insensitive" } } }
          ]
        });

      const filter = query.filter;
      if (filter)
        for (const key of Object.keys(filter))
          if (!studentFilterableFields.includes(key)) throw new BadRequestException(I18nContext.current()?.t("message.common.invalid_filter_field") ?? "Invalid filter field");

      if (filter?.studentNumber)
        conditions.push({
          studentNumber: { contains: filter.studentNumber.toString(), mode: "insensitive" }
        });
      if (filter?.firstName)
        conditions.push({ firstName: { contains: filter.firstName.toString(), mode: "insensitive" } });
      if (filter?.lastName)
        conditions.push({ lastName: { contains: filter.lastName.toString(), mode: "insensitive" } });
      if (filter?.programId) conditions.push({ programId: filter.programId.toString() });

      if (filter?.createdAt && typeof filter.createdAt === "string")
        conditions.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
      if (filter?.updatedAt && typeof filter.updatedAt === "string")
        conditions.push({ updatedAt: parseDateRangeFilter(filter.updatedAt, "updatedAt") });

      const where: Prisma.StudentWhereInput = { AND: conditions };
      const [totalCount, students] = await Promise.all([db.student.count({ where }), db.student.findMany({ where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit, select })]);

      return { data: students, meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) } };
    },

    findOne(id: string, instituteId: string): Promise<StudentList | null> {
      return db.student.findFirst({ where: { id, instituteId }, select });
    }
  };
}
