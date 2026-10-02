import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { DatatableType, PaginationResponse } from "@common";
import { prisma, StudentList, StudentRepository } from "@repositories";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentsService {
    constructor(private readonly i18n: I18nService) { }
    private async ensureProgram(programId: string, instituteId: string) {
        const p = await prisma.program.findFirst(
            {
                where:
                {
                    id: programId,
                    instituteId
                },
                select:
                {
                    id: true
                }
            });

        if (!p)
            throw new UnprocessableEntityException({
                message: this.i18n.t("message.student.program_invalid"),
                error: { programId: [this.i18n.t("message.student.program_invalid")] }
            });
    }

    private async ensureUser(userId: string, instituteId: string) {
        const m = await prisma.instituteMembership.findFirst(
            {
                where:
                {
                    userId,
                    instituteId,
                    status: "ACTIVE"
                },
                select:
                {
                    id: true
                }
            });
        if (!m) throw new UnprocessableEntityException(
            {
                message: this.i18n.t("message.student.user_invalid"),
                error: { userId: [this.i18n.t("message.student.user_invalid")] }
            });
    }
    async create(dto: CreateStudentDto, instituteId: string): Promise<void> {
        await this.ensureUser(dto.userId, instituteId);
        await this.ensureProgram(dto.programId, instituteId);
        const number = await prisma.student.findFirst(
            {
                where:
                    { instituteId, studentNumber: dto.studentNumber },
                select: { id: true }
            });
        if (number) throw new UnprocessableEntityException(
            {
                message: this.i18n.t("message.student.number_exists"),
                error: { studentNumber: [this.i18n.t("message.student.number_exists")] }
            });

        const user = await prisma.student.findUnique(
            {
                where:
                    { userId: dto.userId },
                select: { id: true }
            });
        if (user)
            throw new UnprocessableEntityException(
                {
                    message: this.i18n.t("message.student.user_exists"),
                    error: { userId: [this.i18n.t("message.student.user_exists")] }
                });
        await prisma.student.create({ data: { ...dto, instituteId } });
    }
    findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<StudentList>> { return StudentRepository().findAll(query, instituteId); }
    async findOne(id: string, instituteId: string): Promise<StudentList> {
        const s = await StudentRepository().findOne(id, instituteId);
        if (!s) throw new NotFoundException(this.i18n.t("message.student.not_found", { args: { id } }));

        return s;
    }
    async update(id: string, dto: UpdateStudentDto, instituteId: string): Promise<void> {
        await this.findOne(id, instituteId);
        if (dto.programId)
            await this.ensureProgram(dto.programId, instituteId);

        if (dto.userId) {
            await this.ensureUser(dto.userId, instituteId);
            const u = await prisma.student.findFirst({ where: { userId: dto.userId, NOT: { id } }, select: { id: true } });
            if (u) throw new UnprocessableEntityException({ message: this.i18n.t("message.student.user_exists"), error: { userId: [this.i18n.t("message.student.user_exists")] } });
        }
        if (dto.studentNumber) {
            const n = await prisma.student.findFirst({ where: { instituteId, studentNumber: dto.studentNumber, NOT: { id } }, select: { id: true } });
            if (n) throw new UnprocessableEntityException({ message: this.i18n.t("message.student.number_exists"), error: { studentNumber: [this.i18n.t("message.student.number_exists")] } });
        }
        await prisma.student.update({ where: { id }, data: dto });
    }
    async remove(id: string, instituteId: string): Promise<void> {
        await this.findOne(id, instituteId);
        const s = await prisma.student.findUnique({ where: { id }, select: { _count: { select: { registrations: true } } } });
        if ((s?._count.registrations ?? 0) > 0)
            throw new UnprocessableEntityException(this.i18n.t("message.student.in_use"));
        await prisma.student.delete({ where: { id } });
    }
}
