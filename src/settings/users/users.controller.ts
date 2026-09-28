import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Res,
	Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

import {
	ApiStandardResponses,
	CurrentInstituteId,
	TenantRequired,
	ApiSuccessResponse,
	DatatableType,
	DefaultApiNotFoundResponse,
	FilterValidationPipe,
	PermissionAuth,
	ResponseHandler,
	RoleAuth,
} from "@common";
import { defaultSort, paginationLength } from "@utils";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import type { FastifyReply } from "fastify";
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiTags,
} from "@nestjs/swagger";
import { ApiDatatableQueries } from "@common/decorators/api-datatable-queries/api-datatable-queries.decorator";
import { userSortableFields, userFilterableFields } from "@repositories";
import { I18nService } from "nestjs-i18n";

@Controller("users")
@TenantRequired()
@ApiTags("Settings/Users")
@ApiBearerAuth("Bearer")
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly i18n: I18nService,
	) { }

	@Post()
	@PermissionAuth("user:create")
	@ApiStandardResponses()
	@ApiCreatedResponse({
		description: "User created successfully",
		example: {
			success: true,
			statusCode: 201,
			message: "User created successfully",
			data: null,
		},
	})
	async create(@Body() createUserDto: CreateUserDto, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			await this.usersService.create(createUserDto, instituteId);
			return res
				.status(201)
				.send(
					ResponseHandler.success<void>(
						201,
						this.i18n.t("message.user.create_success"),
						undefined,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Post(":id/resend-verify-email")
	@PermissionAuth("user:update")
	@ApiStandardResponses()
	@ApiOkResponse({
		description: "Verification email resent successfully",
		example: {
			success: true,
			statusCode: 200,
			message: "Email verified successfully",
			data: null,
		},
	})
	async resendVerifyEmail(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			await this.usersService.resendVerificationEmail(id, instituteId);
			return res
				.status(200)
				.send(
					ResponseHandler.success<void>(
						200,
						this.i18n.t("message.user.resend_verification_success"),
						undefined,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Get()
	@PermissionAuth("user:list")
	@ApiStandardResponses({
		validation: false,
	})
	@ApiDatatableQueries({
		sortFields: userSortableFields,
		filterFields: userFilterableFields,
	})
	@ApiSuccessResponse(200, "Users retrieved successfully", {
		data: [
			{
				id: "user-id",
				name: "John Doe",
				email: "john.doe@example.com",
				status: "ACTIVE",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
		],
		meta: {
			page: 1,
			limit: 10,
			totalCount: 100,
			totalPages: 10,
		},
	})
	async findAll(
		@Query("page") page: number,
		@Query("limit") limit: number,
		@Query("search") search: string,
		@Query("sort") sort: string,
		@Query("sortDirection") sortDirection: string,
		@Query(new FilterValidationPipe())
		filter: Record<string, string | boolean | Date> | null,
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

			const users = await this.usersService.findAll(query, instituteId);
			return res
				.status(200)
				.send(
					ResponseHandler.success(
						200,
						this.i18n.t("message.user.retrieved_success"),
						users,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Get(":id")
	@PermissionAuth("user:view")
	@ApiStandardResponses({
		validation: false,
	})
	@ApiSuccessResponse(200, "User fetched successfully", {
		id: "user-id",
		name: "John Doe",
		email: "johndoe@example.com",
		status: "ACTIVE",
		roles: ["admin"],
	})
	@DefaultApiNotFoundResponse()
	async findOne(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			const user = await this.usersService.findOne(id, instituteId);
			return res.status(200).send(
				ResponseHandler.success(
					200,
					this.i18n.t("message.user.found_success"),
					user,
				),
			);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Patch(":id")
	@PermissionAuth("user:update")
	@ApiStandardResponses({})
	@ApiSuccessResponse(200, "User updated successfully", null, {
		type: "null",
	})
	@DefaultApiNotFoundResponse()
	async update(
		@Param("id") id: string,
		@Body() updateUserDto: UpdateUserDto,
		@CurrentInstituteId() instituteId: string,
		@Res() res: FastifyReply,
	) {
		try {
			await this.usersService.update(id, updateUserDto, instituteId);
			return res.status(200)
				.send(
					ResponseHandler.success<void>(
						200,
						this.i18n.t("message.user.update_success"),
						undefined,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Patch(":id/status")
	@PermissionAuth("user:update")
	@ApiStandardResponses({})
	@ApiSuccessResponse(200, "User status updated successfully", null, {
		type: "null",
	})
	@DefaultApiNotFoundResponse()
	async updateStatus(
		@Param("id") id: string,
		@Body() updateStatusDto: UpdateStatusDto,
		@CurrentInstituteId() instituteId: string,
		@Res() res: FastifyReply,
	) {
		try {
			await this.usersService.updateStatus(id, updateStatusDto, instituteId);
			return res
				.status(200)
				.send(
					ResponseHandler.success<void>(
						200,
						this.i18n.t("message.user.status_update_success"),
						undefined,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Patch(":id/password")
	@RoleAuth("SUPER_ADMIN")
	@ApiStandardResponses({})
	@ApiSuccessResponse(200, "User password updated successfully", null, {
		type: "null",
	})
	@DefaultApiNotFoundResponse()
	async updatePassword(
		@Param("id") id: string,
		@Body() updatePasswordDto: UpdatePasswordDto,
		@CurrentInstituteId() instituteId: string,
		@Res() res: FastifyReply,
	) {
		try {
			await this.usersService.updatePassword(id, updatePasswordDto, instituteId);
			return res
				.status(200)
				.send(
					ResponseHandler.success<void>(
						200,
						this.i18n.t("message.user.password_update_success"),
						undefined,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}

	@Delete(":id")
	@PermissionAuth("user:delete")
	@ApiStandardResponses({
		validation: false,
	})
	@ApiSuccessResponse(200, "User deleted successfully", null, {
		type: "null",
	})
	@DefaultApiNotFoundResponse()
	async remove(@Param("id") id: string, @CurrentInstituteId() instituteId: string, @Res() res: FastifyReply) {
		try {
			await this.usersService.remove(id, instituteId);
			return res
				.status(200)
				.send(
					ResponseHandler.success<void>(
						200,
						this.i18n.t("message.user.delete_success"),
						undefined,
					),
				);
		} catch (error) {
			return ResponseHandler.handleError(res, error);
		}
	}
}
