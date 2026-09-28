import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import { ApiStandardResponses, ApiSuccessResponse, DatatableType, PaginationResponse, DefaultApiNotFoundResponse, FilterValidationPipe, ResponseHandler, RoleAuth } from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { defaultSort, paginationLength } from "@utils";
import { instituteFilterableFields, instituteSortableFields, InstituteList } from "@repositories";
import { InstitutesService } from "./institutes.service";
import { CreateInstituteDto } from "./dto/create-institute.dto";
import { UpdateInstituteDto } from "./dto/update-institute.dto";

@Controller("institutes")
@RoleAuth("SUPER_ADMIN")
@ApiTags("Institutes")
@ApiBearerAuth("Bearer")
export class InstitutesController {
	constructor(private readonly service: InstitutesService, private readonly i18n: I18nService) {}

	@Post()
	@ApiStandardResponses()
	async create(@Body() dto: CreateInstituteDto, @Res() res: FastifyReply) {
		try { await this.service.create(dto); return res.status(201).send(ResponseHandler.success(201, this.i18n.t("message.institute.create_success"), undefined)); } catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get()
	@ApiDatatableQueries({ sortFields: instituteSortableFields, filterFields: instituteFilterableFields })
	@ApiStandardResponses({ validation: false })
	async findAll(@Query("page") page: number, @Query("limit") limit: number, @Query("search") search: string, @Query("sort") sort: string, @Query("sortDirection") sortDirection: string, @Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null, @Res() res: FastifyReply) {
		try {
			const query: DatatableType = { page: page || 1, limit: limit || paginationLength, search: search || null, sort: sort || defaultSort, sortDirection: sortDirection === "asc" ? "asc" : "desc", filter: filter || null };
			const result = await this.service.findAll(query);
			return res.status(200).send(ResponseHandler.success<PaginationResponse<InstituteList>>(200, this.i18n.t("message.institute.retrieved_success"), result));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get(":id")
	@DefaultApiNotFoundResponse("Institute")
	async findOne(@Param("id") id: string, @Res() res: FastifyReply) {
		try { return res.status(200).send(ResponseHandler.success(200, this.i18n.t("message.institute.found_success"), await this.service.findOne(id))); } catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Patch(":id")
	@DefaultApiNotFoundResponse("Institute")
	async update(@Param("id") id: string, @Body() dto: UpdateInstituteDto, @Res() res: FastifyReply) {
		try { await this.service.update(id, dto); return res.status(200).send(ResponseHandler.success(200, this.i18n.t("message.institute.update_success"), undefined)); } catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Delete(":id")
	@DefaultApiNotFoundResponse("Institute")
	async remove(@Param("id") id: string, @Res() res: FastifyReply) {
		try { await this.service.remove(id); return res.status(200).send(ResponseHandler.success(200, this.i18n.t("message.institute.delete_success"), undefined)); } catch (error) { return ResponseHandler.handleError(res, error); }
	}
}
