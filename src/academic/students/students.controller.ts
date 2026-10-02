import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import { ApiStandardResponses, CurrentInstituteId, DatatableType, DefaultApiNotFoundResponse, FilterValidationPipe, PaginationResponse, PermissionAuth, ResponseHandler, TenantRequired } from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { StudentList, studentFilterableFields, studentSortableFields } from "@repositories";
import { defaultSort, paginationLength } from "@utils";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentsService } from "./students.service";

@Controller("students")
@TenantRequired()
@ApiTags("Academic/Students")
@ApiBearerAuth("Bearer")
export class StudentsController {
	constructor(private readonly service: StudentsService, private readonly i18n: I18nService) { }

	@Post()
	@PermissionAuth("student:create")
	@ApiStandardResponses()
	async create(@Body() dto: CreateStudentDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.create(dto, instituteId); return res.status(201).send(ResponseHandler.success<void>(201, this.i18n.t("message.student.create_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get()
	@PermissionAuth("student:list")
	@ApiDatatableQueries({ sortFields: studentSortableFields, filterFields: studentFilterableFields })
	@ApiStandardResponses({ validation: false })
	async findAll(@Query("page") page: number, @Query("limit") limit: number, @Query("search") search: string, @Query("sort") sort: string, @Query("sortDirection") sortDirection: string, @Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			const query: DatatableType = { page: page || 1, limit: limit || paginationLength, search: search || null, sort: sort || defaultSort, sortDirection: sortDirection === "asc" ? "asc" : "desc", filter: filter || null };
			const result = await this.service.findAll(query, instituteId);
			return res.status(200).send(ResponseHandler.success<PaginationResponse<StudentList>>(200, this.i18n.t("message.student.retrieved_success"), result));
		} catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Get(":id")
	@PermissionAuth("student:view")
	@DefaultApiNotFoundResponse("Student")
	async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { return res.status(200).send(ResponseHandler.success<StudentList>(200, this.i18n.t("message.student.found_success"), await this.service.findOne(id, instituteId))); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Patch(":id")
	@PermissionAuth("student:update")
	@ApiStandardResponses()
	@DefaultApiNotFoundResponse("Student")
	async update(@Param("id") id: string, @Body() dto: UpdateStudentDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.update(id, dto, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.student.update_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}

	@Delete(":id")
	@PermissionAuth("student:delete")
	@ApiStandardResponses({ validation: false })
	@DefaultApiNotFoundResponse("Student")
	async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try { await this.service.remove(id, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.student.delete_success"), undefined)); }
		catch (error) { return ResponseHandler.handleError(res, error); }
	}
}
