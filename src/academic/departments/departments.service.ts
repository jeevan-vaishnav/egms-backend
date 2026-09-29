import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { DatatableType, PaginationResponse } from "@common";
import { DepartmentList, DepartmentRepository, prisma } from "@repositories";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Injectable()
export class DepartmentsService {
	constructor(private readonly i18n: I18nService) {}

	async create(dto: CreateDepartmentDto, instituteId: string): Promise<void> {
		const duplicate = await prisma.department.findFirst({
			where: {
				instituteId,
				OR: [{ code: dto.code }, { name: dto.name }],
			},
			select: { code: true, name: true },
		});

		if (duplicate?.code === dto.code) {
			throw new UnprocessableEntityException({
				message: this.i18n.t("message.department.code_exists"),
				error: { code: [this.i18n.t("message.department.code_exists")] },
			});
		}
		if (duplicate?.name === dto.name) {
			throw new UnprocessableEntityException({
				message: this.i18n.t("message.department.name_exists"),
				error: { name: [this.i18n.t("message.department.name_exists")] },
			});
		}

		await prisma.department.create({ data: { ...dto, instituteId } });
	}

	findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<DepartmentList>> {
		return DepartmentRepository().findAll(query, instituteId);
	}

	async findOne(id: string, instituteId: string): Promise<DepartmentList> {
		const department = await DepartmentRepository().findOne(id, instituteId);
		if (!department) {
			throw new NotFoundException(this.i18n.t("message.department.not_found", { args: { id } }));
		}
		return department;
	}

	async update(id: string, dto: UpdateDepartmentDto, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);

		if (dto.code) {
			const codeExists = await prisma.department.findFirst({
				where: { instituteId, code: dto.code, NOT: { id } },
				select: { id: true },
			});
			if (codeExists) {
				throw new UnprocessableEntityException({
					message: this.i18n.t("message.department.code_exists"),
					error: { code: [this.i18n.t("message.department.code_exists")] },
				});
			}
		}

		if (dto.name) {
			const nameExists = await prisma.department.findFirst({
				where: { instituteId, name: dto.name, NOT: { id } },
				select: { id: true },
			});
			if (nameExists) {
				throw new UnprocessableEntityException({
					message: this.i18n.t("message.department.name_exists"),
					error: { name: [this.i18n.t("message.department.name_exists")] },
				});
			}
		}

		await prisma.department.update({ where: { id }, data: dto });
	}

	async remove(id: string, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);

		const relations = await prisma.department.findUnique({
			where: { id },
			select: {
				_count: { select: { programs: true, courses: true, lecturers: true } },
			},
		});
		if (relations && (relations._count.programs || relations._count.courses || relations._count.lecturers)) {
			throw new UnprocessableEntityException(this.i18n.t("message.department.in_use"));
		}

		await prisma.department.delete({ where: { id } });
	}
}
