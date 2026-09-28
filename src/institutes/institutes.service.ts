import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { prisma } from "@repositories";
import { DatatableType, PaginationResponse } from "@common";
import { InstituteList, InstituteRepository } from "@repositories";
import { I18nService } from "nestjs-i18n";
import { CreateInstituteDto } from "./dto/create-institute.dto";
import { UpdateInstituteDto } from "./dto/update-institute.dto";
import { DateUtils } from "@utils";

@Injectable()
export class InstitutesService {
	constructor(private readonly i18n: I18nService) {}

	async create(dto: CreateInstituteDto): Promise<void> {
		const exists = await prisma.institute.findFirst({ where: { code: dto.code, deletedAt: null }, select: { id: true } });
		if (exists) throw new UnprocessableEntityException({ message: this.i18n.t("message.institute.code_exists"), error: { code: [this.i18n.t("message.institute.code_exists")] } });
		await prisma.institute.create({ data: dto });
	}

	findAll(query: DatatableType): Promise<PaginationResponse<InstituteList>> { return InstituteRepository().findAll(query); }

	async findOne(id: string): Promise<InstituteList> {
		const data = await InstituteRepository().findOne(id);
		if (!data) throw new NotFoundException(this.i18n.t("message.institute.not_found", { args: { id } }));
		return data;
	}

	async update(id: string, dto: UpdateInstituteDto): Promise<void> {
		await this.findOne(id);
		if (dto.code) {
			const exists = await prisma.institute.findFirst({ where: { code: dto.code, deletedAt: null, NOT: { id } }, select: { id: true } });
			if (exists) throw new UnprocessableEntityException({ message: this.i18n.t("message.institute.code_exists"), error: { code: [this.i18n.t("message.institute.code_exists")] } });
		}
		await prisma.institute.update({ where: { id }, data: dto });
	}

	async remove(id: string): Promise<void> {
		await this.findOne(id);
		await prisma.institute.update({ where: { id }, data: { deletedAt: DateUtils.now().toDate() } });
	}
}
