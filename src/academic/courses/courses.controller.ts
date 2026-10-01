import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { I18nService } from "nestjs-i18n";
import { ApiStandardResponses, CurrentInstituteId, DatatableType, DefaultApiNotFoundResponse, FilterValidationPipe, PaginationResponse, PermissionAuth, ResponseHandler, TenantRequired } from "@common";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { CourseList, courseFilterableFields, courseSortableFields } from "@repositories";
import { defaultSort, paginationLength } from "@utils";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CoursesService } from "./courses.service";

@Controller("courses")
@TenantRequired()
@ApiTags("Academic/Courses")
@ApiBearerAuth("Bearer")
export class CoursesController {
    constructor(private readonly service: CoursesService, private readonly i18n: I18nService) { }

    @Post()
    @PermissionAuth("course:create")
    @ApiStandardResponses()
    async create(@Body() dto: CreateCourseDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
        try { await this.service.create(dto, instituteId); return res.status(201).send(ResponseHandler.success<void>(201, this.i18n.t("message.course.create_success"), undefined)); }
        catch (error) { return ResponseHandler.handleError(res, error); }
    }

    @Get()
    @PermissionAuth("course:list")
    @ApiDatatableQueries({ sortFields: courseSortableFields, filterFields: courseFilterableFields })
    @ApiStandardResponses({ validation: false })
    async findAll(@Query("page") page: number, @Query("limit") limit: number, @Query("search") search: string, @Query("sort") sort: string, @Query("sortDirection") sortDirection: string, @Query(new FilterValidationPipe()) filter: Record<string, string | boolean | Date> | null, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
        try {
            const query: DatatableType = { page: page || 1, limit: limit || paginationLength, search: search || null, sort: sort || defaultSort, sortDirection: sortDirection === "asc" ? "asc" : "desc", filter: filter || null };
            const result = await this.service.findAll(query, instituteId);
            return res.status(200).send(ResponseHandler.success<PaginationResponse<CourseList>>(200, this.i18n.t("message.course.retrieved_success"), result));
        } catch (error) { return ResponseHandler.handleError(res, error); }
    }

    @Get(":id")
    @PermissionAuth("course:view")
    @DefaultApiNotFoundResponse("Course")
    async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
        try { return res.status(200).send(ResponseHandler.success<CourseList>(200, this.i18n.t("message.course.found_success"), await this.service.findOne(id, instituteId))); }
        catch (error) { return ResponseHandler.handleError(res, error); }
    }

    @Patch(":id")
    @PermissionAuth("course:update")
    @ApiStandardResponses()
    @DefaultApiNotFoundResponse("Course")
    async update(@Param("id") id: string, @Body() dto: UpdateCourseDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
        try { await this.service.update(id, dto, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.course.update_success"), undefined)); }
        catch (error) { return ResponseHandler.handleError(res, error); }
    }

    @Delete(":id")
    @PermissionAuth("course:delete")
    @ApiStandardResponses({ validation: false })
    @DefaultApiNotFoundResponse("Course")
    async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
        try { await this.service.remove(id, instituteId); return res.status(200).send(ResponseHandler.success<void>(200, this.i18n.t("message.course.delete_success"), undefined)); }
        catch (error) { return ResponseHandler.handleError(res, error); }
    }
}
