import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import { ApiStandardResponses, CurrentInstituteId, DatatableType, DefaultApiNotFoundResponse, FilterValidationPipe, PaginationResponse, PermissionAuth, ResponseHandler, TenantRequired } from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { SemesterList, semesterFilterableFields, semesterSortableFields } from "@repositories";
import { defaultSort, paginationLength } from "@utils";

import { SemestersService } from "./semesters.service";
import { CreateSemesterDto } from "./dto/create-semesters.dto";
import { UpdateSemesterDto } from "./dto/update-semesters.dto";

@Controller("semesters")
@TenantRequired()
@ApiTags("Academic/Semesters")
@ApiBearerAuth("Bearer")
export class SemestersController {
	constructor(private readonly service: SemestersService, private readonly i18n: I18nService) {}

	@Post()
	@PermissionAuth("semester:create")
	@ApiStandardResponses()
	async create(@Body() dto: CreateSemesterDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.create(dto, instituteId); return res.status(201).send(ResponseHandler.success<void>(201, this.i18n.t("message.semester.create_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get()
	@PermissionAuth("semester:list")
	@ApiDatatableQueries({ sortFields: semesterSortableFields, filterFields: semesterFilterableFields })
	@ApiStandardResponses({ validation: false })
	async findAll(@Query("page") page: number, @Query("limit") limit: number, @Query("search") search: string, @Query("sort") sort: string, @Query("sortDirection") sortDirection: string, @Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			const query: DatatableType = { page: page || 1, limit: limit || paginationLength, search: search || null, sort: sort || defaultSort, sortDirection: sortDirection === "asc" ? "asc" : "desc", filter: filter || null };
			const result = await this.service.findAll(query, instituteId);
			return res.status(200).send(ResponseHandler.success<PaginationResponse<SemesterList>>(200, this.i18n.t("message.semester.retrieved_success"), result));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get(":id")
	@PermissionAuth("semester:view")
	@DefaultApiNotFoundResponse("Semester")
	async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { return res.status(200).send(ResponseHandler.success<SemesterList>(200, this.i18n.t("message.semester.found_success"), await this.service.findOne(id, instituteId))); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Patch(":id")
	@PermissionAuth("semester:update")
	@ApiStandardResponses()
	@DefaultApiNotFoundResponse("Semester")
	async update(@Param("id") id: string, @Body() dto: UpdateSemesterDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.update(id, dto, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.semester.update_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Delete(":id")
	@PermissionAuth("semester:delete")
	@ApiStandardResponses({ validation: false })
	@DefaultApiNotFoundResponse("Semester")
	async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.remove(id, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.semester.delete_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}
}
