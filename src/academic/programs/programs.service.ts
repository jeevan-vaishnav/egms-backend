import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { DatatableType, PaginationResponse } from "@common";
import { prisma, ProgramList, ProgramRepository } from "@repositories";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";

@Injectable()
export class ProgramsService {
	constructor(private readonly i18n: I18nService) {}

	private async ensureDepartment(departmentId: string, instituteId: string): Promise<void> {
		const department = await prisma.department.findFirst({ where: { id: departmentId, instituteId }, select: { id: true } });
		if (!department) throw new UnprocessableEntityException({
			message: this.i18n.t("message.program.department_invalid"),
			error: { departmentId: [this.i18n.t("message.program.department_invalid")] },
		});
	}

	async create(dto: CreateProgramDto, instituteId: string): Promise<void> {
		await this.ensureDepartment(dto.departmentId, instituteId);
		const duplicate = await prisma.program.findFirst({ where: { instituteId, code: dto.code }, select: { id: true } });
		if (duplicate) throw new UnprocessableEntityException({
			message: this.i18n.t("message.program.code_exists"),
			error: { code: [this.i18n.t("message.program.code_exists")] },
		});
		await prisma.program.create({ data: { ...dto, instituteId } });
	}

	findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<ProgramList>> {
		return ProgramRepository().findAll(query, instituteId);
	}

	async findOne(id: string, instituteId: string): Promise<ProgramList> {
		const program = await ProgramRepository().findOne(id, instituteId);
		if (!program) throw new NotFoundException(this.i18n.t("message.program.not_found", { args: { id } }));
		return program;
	}

	async update(id: string, dto: UpdateProgramDto, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		if (dto.departmentId) await this.ensureDepartment(dto.departmentId, instituteId);
		if (dto.code) {
			const duplicate = await prisma.program.findFirst({ where: { instituteId, code: dto.code, NOT: { id } }, select: { id: true } });
			if (duplicate) throw new UnprocessableEntityException({
				message: this.i18n.t("message.program.code_exists"),
				error: { code: [this.i18n.t("message.program.code_exists")] },
			});
		}
		await prisma.program.update({ where: { id }, data: dto });
	}

	async remove(id: string, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		const relations = await prisma.program.findUnique({ where: { id }, select: { _count: { select: { students: true } } } });
		if (relations?._count.students) throw new UnprocessableEntityException(this.i18n.t("message.program.in_use"));
		await prisma.program.delete({ where: { id } });
	}
}
