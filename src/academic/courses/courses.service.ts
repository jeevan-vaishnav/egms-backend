import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { DatatableType, PaginationResponse } from "@common";
import { CourseList, CourseRepository, prisma } from "@repositories";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@Injectable()
export class CoursesService {

    constructor(private readonly i18n: I18nService) { }

    private async ensureDepartment(departmentId: string, instituteId: string) {
        const d = await prisma.department.findFirst({
            where: { id: departmentId, instituteId },
            select: { id: true }
        });
        if (!d)
            throw new UnprocessableEntityException(
                {
                    message: this.i18n.t("message.course.department_invalid"),
                    error: { departmentId: [this.i18n.t("message.course.department_invalid")] }
                });
    }

    async create(dto: CreateCourseDto, instituteId: string): Promise<void> {
        await this.ensureDepartment(dto.departmentId, instituteId);
        const duplicate = await prisma.course.findFirst({
            where:
            {
                instituteId,
                code: dto.code
            },
            select:
                { id: true }
        });

        if (duplicate) throw new UnprocessableEntityException({
            message: this.i18n.t("message.course.code_exists"),
            error: { code: [this.i18n.t("message.course.code_exists")] }
        });

        await prisma.course.create({ data: { ...dto, instituteId } });
    }

    findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<CourseList>> {
        return CourseRepository().findAll(query, instituteId);
    }
    async findOne(id: string, instituteId: string): Promise<CourseList> {
        const c = await CourseRepository().findOne(id, instituteId);
        if (!c) throw new NotFoundException(this.i18n.t("message.course.not_found", { args: { id } }));
        return c;
    }
    async update(id: string, dto: UpdateCourseDto, instituteId: string): Promise<void> {
        await this.findOne(id, instituteId);
        if (dto.departmentId)
            await this.ensureDepartment(dto.departmentId, instituteId);
        if (dto.code) {
            const duplicate = await prisma.course.findFirst({
                where: { instituteId, code: dto.code, NOT: { id } },
                select: { id: true }
            });
            if (duplicate) throw new UnprocessableEntityException({ message: this.i18n.t("message.course.code_exists"), error: { code: [this.i18n.t("message.course.code_exists")] } });
        }
        await prisma.course.update({ where: { id }, data: dto });
    }

    async remove(id: string, instituteId: string): Promise<void> {
        await this.findOne(id, instituteId);
        const r = await prisma.course.findUnique(
            {
                where: { id },
                select: { _count: { select: { registrations: true, assignments: true } } }
            });

        if ((r?._count.registrations ?? 0) > 0 || (r?._count.assignments ?? 0) > 0) throw new UnprocessableEntityException(this.i18n.t("message.course.in_use"));
        await prisma.course.delete({ where: { id } });
    }




}
