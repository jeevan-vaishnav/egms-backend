import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { DatatableType, PaginationResponse } from "@common";
import { AcademicYearList, AcademicYearRepository, prisma } from "@repositories";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";

@Injectable()
export class AcademicYearsService {
	constructor(private readonly i18n: I18nService) {}

	private validateYears(startYear: number, endYear: number): void {
		if (endYear <= startYear) {
			throw new UnprocessableEntityException({
				message: this.i18n.t("message.academic_year.invalid_year_range"),
				error: { endYear: [this.i18n.t("message.academic_year.invalid_year_range")] },
			});
		}
	}

	async create(dto: CreateAcademicYearDto, instituteId: string): Promise<void> {
		this.validateYears(dto.startYear, dto.endYear);
		const duplicate = await prisma.academicYear.findFirst({ where: { instituteId, name: dto.name }, select: { id: true } });
		if (duplicate) throw new UnprocessableEntityException({
			message: this.i18n.t("message.academic_year.name_exists"),
			error: { name: [this.i18n.t("message.academic_year.name_exists")] },
		});
		await prisma.academicYear.create({ data: { ...dto, instituteId } });
	}

	findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<AcademicYearList>> {
		return AcademicYearRepository().findAll(query, instituteId);
	}

	async findOne(id: string, instituteId: string): Promise<AcademicYearList> {
		const academicYear = await AcademicYearRepository().findOne(id, instituteId);
		if (!academicYear) throw new NotFoundException(this.i18n.t("message.academic_year.not_found", { args: { id } }));
		return academicYear;
	}

	async update(id: string, dto: UpdateAcademicYearDto, instituteId: string): Promise<void> {
		const current = await this.findOne(id, instituteId);
		const startYear = dto.startYear ?? current.startYear;
		const endYear = dto.endYear ?? current.endYear;
		this.validateYears(startYear, endYear);
		if (dto.name) {
			const duplicate = await prisma.academicYear.findFirst({ where: { instituteId, name: dto.name, NOT: { id } }, select: { id: true } });
			if (duplicate) throw new UnprocessableEntityException({
				message: this.i18n.t("message.academic_year.name_exists"),
				error: { name: [this.i18n.t("message.academic_year.name_exists")] },
			});
		}
		await prisma.academicYear.update({ where: { id }, data: dto });
	}

	async remove(id: string, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		const relations = await prisma.academicYear.findUnique({ where: { id }, select: { _count: { select: { semesters: true } } } });
		if (relations?._count.semesters) throw new UnprocessableEntityException(this.i18n.t("message.academic_year.in_use"));
		await prisma.academicYear.delete({ where: { id } });
	}
}
