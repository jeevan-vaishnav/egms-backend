import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import { ApiStandardResponses, CurrentInstituteId, DatatableType, DefaultApiNotFoundResponse, FilterValidationPipe, PaginationResponse, PermissionAuth, ResponseHandler, TenantRequired } from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { AcademicYearList, academicYearFilterableFields, academicYearSortableFields } from "@repositories";
import { defaultSort, paginationLength } from "@utils";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";
import { AcademicYearsService } from "./academic-years.service";

@Controller("academic-years")
@TenantRequired()
@ApiTags("Academic/Academic Years")
@ApiBearerAuth("Bearer")
export class AcademicYearsController {
	constructor(private readonly service: AcademicYearsService, private readonly i18n: I18nService) { }

	@Post()
	@PermissionAuth("academic-year:create")
	@ApiStandardResponses()
	async create(@Body() dto: CreateAcademicYearDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.create(dto, instituteId); return res.status(201).send(ResponseHandler.success<void>(201, this.i18n.t("message.academic_year.create_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get()
	@PermissionAuth("academic-year:list")
	@ApiDatatableQueries({ sortFields: academicYearSortableFields, filterFields: academicYearFilterableFields })
	@ApiStandardResponses({ validation: false })
	async findAll(@Query("page") page: number, @Query("limit") limit: number, @Query("search") search: string, @Query("sort") sort: string, @Query("sortDirection") sortDirection: string, @Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			const query: DatatableType = { page: page || 1, limit: limit || paginationLength, search: search || null, sort: sort || defaultSort, sortDirection: sortDirection === "asc" ? "asc" : "desc", filter: filter || null };
			const result = await this.service.findAll(query, instituteId);
			return res.status(200).send(ResponseHandler.success<PaginationResponse<AcademicYearList>>(200, this.i18n.t("message.academic_year.retrieved_success"), result));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get(":id")
	@PermissionAuth("academic-year:view")
	@DefaultApiNotFoundResponse("Academic Year")
	async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { return res.status(200).send(ResponseHandler.success<AcademicYearList>(200, this.i18n.t("message.academic_year.found_success"), await this.service.findOne(id, instituteId))); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Patch(":id")
	@PermissionAuth("academic-year:update")
	@ApiStandardResponses()
	@DefaultApiNotFoundResponse("Academic Year")
	async update(@Param("id") id: string, @Body() dto: UpdateAcademicYearDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.update(id, dto, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.academic_year.update_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Delete(":id")
	@PermissionAuth("academic-year:delete")
	@ApiStandardResponses({ validation: false })
	@DefaultApiNotFoundResponse("Academic Year")
	async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.remove(id, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.academic_year.delete_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}
}
