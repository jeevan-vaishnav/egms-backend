import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { DatatableType, PaginationResponse } from "@common";
import { SemesterList, SemesterRepository, prisma } from "@repositories";
import { CreateSemesterDto } from "./dto/create-semesters.dto";
import { UpdateSemesterDto } from "./dto/update-semesters.dto";


@Injectable()
export class SemestersService {
    constructor(private readonly i18n: I18nService) { }

    private async ensureAcademicYear(academicYearId: string, instituteId: string): Promise<void> {
        const academicYear = await prisma.academicYear.findFirst({ where: { id: academicYearId, instituteId }, select: { id: true } });
        if (!academicYear) throw new UnprocessableEntityException({
            message: this.i18n.t("message.semester.academic_year_invalid"),
            error: { academicYearId: [this.i18n.t("message.semester.academic_year_invalid")] },
        });
    }

    async create(dto: CreateSemesterDto, instituteId: string): Promise<void> {
        await this.ensureAcademicYear(dto.academicYearId, instituteId);
        const duplicate = await prisma.semester.findFirst({ where: { academicYearId: dto.academicYearId, name: dto.name }, select: { id: true } });
        if (duplicate) throw new UnprocessableEntityException({
            message: this.i18n.t("message.semester.name_exists"),
            error: { name: [this.i18n.t("message.semester.name_exists")] },
        });
        await prisma.semester.create({ data: dto });
    }

    findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<SemesterList>> {
        return SemesterRepository().findAll(query, instituteId);
    }

    async findOne(id: string, instituteId: string): Promise<SemesterList> {
        const semester = await SemesterRepository().findOne(id, instituteId);
        if (!semester) throw new NotFoundException(this.i18n.t("message.semester.not_found", { args: { id } }));
        return semester;
    }

    async update(id: string, dto: UpdateSemesterDto, instituteId: string): Promise<void> {
        const current = await this.findOne(id, instituteId);
        const academicYearId = dto.academicYearId ?? current.academicYearId;
        const name = dto.name ?? current.name;
        await this.ensureAcademicYear(academicYearId, instituteId);
        const duplicate = await prisma.semester.findFirst({ where: { academicYearId, name, NOT: { id } }, select: { id: true } });
        if (duplicate) throw new UnprocessableEntityException({
            message: this.i18n.t("message.semester.name_exists"),
            error: { name: [this.i18n.t("message.semester.name_exists")] },
        });
        await prisma.semester.update({ where: { id }, data: dto });
    }

    async remove(id: string, instituteId: string): Promise<void> {
        await this.findOne(id, instituteId);
        const relations = await prisma.semester.findUnique({ where: { id }, select: { _count: { select: { registrations: true, assignments: true } } } });
        if ((relations?._count.registrations ?? 0) > 0 || (relations?._count.assignments ?? 0) > 0) {
            throw new UnprocessableEntityException(this.i18n.t("message.semester.in_use"));
        }
        await prisma.semester.delete({ where: { id } });
    }
}
