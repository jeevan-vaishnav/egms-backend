import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import {
	ApiStandardResponses,
	CurrentInstituteId,
	DatatableType,
	DefaultApiNotFoundResponse,
	FilterValidationPipe,
	PaginationResponse,
	PermissionAuth,
	ResponseHandler,
	TenantRequired,
} from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { DepartmentList, departmentFilterableFields, departmentSortableFields } from "@repositories";
import { defaultSort, paginationLength } from "@utils";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { DepartmentsService } from "./departments.service";

@Controller("departments")
@TenantRequired()
@ApiTags("Academic/Departments")
@ApiBearerAuth("Bearer")
export class DepartmentsController {
	constructor(private readonly service: DepartmentsService, private readonly i18n: I18nService) {}

	@Post()
	@PermissionAuth("department:create")
	@ApiStandardResponses()
	async create(@Body() dto: CreateDepartmentDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			await this.service.create(dto, instituteId);
			return res.status(201).send(ResponseHandler.success<void>(201, this.i18n.t("message.department.create_success"), undefined));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get()
	@PermissionAuth("department:list")
	@ApiDatatableQueries({ sortFields: departmentSortableFields, filterFields: departmentFilterableFields })
	@ApiStandardResponses({ validation: false })
	async findAll(
		@Query("page") page: number,
		@Query("limit") limit: number,
		@Query("search") search: string,
		@Query("sort") sort: string,
		@Query("sortDirection") sortDirection: string,
		@Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null,
		@CurrentInstituteId() instituteId: string,
		@Res() res: FastifyReply,
	) {
		try {
			const query: DatatableType = {
				page: page || 1,
				limit: limit || paginationLength,
				search: search || null,
				sort: sort || defaultSort,
				sortDirection: sortDirection === "asc" ? "asc" : "desc",
				filter: filter || null,
			};
			const result = await this.service.findAll(query, instituteId);
			return res.status(200).send(ResponseHandler.success<PaginationResponse<DepartmentList>>(200, this.i18n.t("message.department.retrieved_success"), result));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get(":id")
	@PermissionAuth("department:view")
	@DefaultApiNotFoundResponse("Department")
	async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			return res.status(200).send(ResponseHandler.success<DepartmentList>(200, this.i18n.t("message.department.found_success"), await this.service.findOne(id, instituteId)));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Patch(":id")
	@PermissionAuth("department:update")
	@ApiStandardResponses()
	@DefaultApiNotFoundResponse("Department")
	async update(@Param("id") id: string, @Body() dto: UpdateDepartmentDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			await this.service.update(id, dto, instituteId);
			return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.department.update_success"), undefined));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Delete(":id")
	@PermissionAuth("department:delete")
	@ApiStandardResponses({ validation: false })
	@DefaultApiNotFoundResponse("Department")
	async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			await this.service.remove(id, instituteId);
			return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.department.delete_success"), undefined));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}
}
