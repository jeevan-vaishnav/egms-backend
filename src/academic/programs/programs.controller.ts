import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import { ApiStandardResponses, CurrentInstituteId, DatatableType, DefaultApiNotFoundResponse, FilterValidationPipe, PaginationResponse, PermissionAuth, ResponseHandler, TenantRequired } from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { ProgramList, programFilterableFields, programSortableFields } from "@repositories";
import { defaultSort, paginationLength } from "@utils";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { ProgramsService } from "./programs.service";

@Controller("programs")
@TenantRequired()
@ApiTags("Academic/Programs")
@ApiBearerAuth("Bearer")
export class ProgramsController {
	constructor(private readonly service: ProgramsService, private readonly i18n: I18nService) {}

	@Post()
	@PermissionAuth("program:create")
	@ApiStandardResponses()
	async create(@Body() dto: CreateProgramDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.create(dto, instituteId); return res.status(201).send(ResponseHandler.success<void>(201, this.i18n.t("message.program.create_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get()
	@PermissionAuth("program:list")
	@ApiDatatableQueries({ sortFields: programSortableFields, filterFields: programFilterableFields })
	@ApiStandardResponses({ validation: false })
	async findAll(@Query("page") page: number, @Query("limit") limit: number, @Query("search") search: string, @Query("sort") sort: string, @Query("sortDirection") sortDirection: string, @Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			const query: DatatableType = { page: page || 1, limit: limit || paginationLength, search: search || null, sort: sort || defaultSort, sortDirection: sortDirection === "asc" ? "asc" : "desc", filter: filter || null };
			const result = await this.service.findAll(query, instituteId);
			return res.status(200).send(ResponseHandler.success<PaginationResponse<ProgramList>>(200, this.i18n.t("message.program.retrieved_success"), result));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get(":id")
	@PermissionAuth("program:view")
	@DefaultApiNotFoundResponse("Program")
	async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { return res.status(200).send(ResponseHandler.success<ProgramList>(200, this.i18n.t("message.program.found_success"), await this.service.findOne(id, instituteId))); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Patch(":id")
	@PermissionAuth("program:update")
	@ApiStandardResponses()
	@DefaultApiNotFoundResponse("Program")
	async update(@Param("id") id: string, @Body() dto: UpdateProgramDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.update(id, dto, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.program.update_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Delete(":id")
	@PermissionAuth("program:delete")
	@ApiStandardResponses({ validation: false })
	@DefaultApiNotFoundResponse("Program")
	async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.remove(id, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.program.delete_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}
}
