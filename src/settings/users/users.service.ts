import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { prisma, UserDetail, UserInformation, UserList, UserRepository } from "@repositories";
import { DatatableType, MailService, PaginationResponse } from "@common";
import { DateUtils, HashUtils, StrUtils } from "@utils";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { getEnv } from "@config";
import { I18nService } from "nestjs-i18n";
import { emailVerificationLifetime } from "@utils/default/token-lifetime";
import { CacheService, UserCache } from "@common";

@Injectable()
export class UsersService {
	constructor(private readonly mailService: MailService, private readonly i18n: I18nService, private readonly cacheService: CacheService) { }

	private async validateRolesForInstitute(roleIds: string[], instituteId: string) {
		const roles = await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true } });
		if (roles.length !== new Set(roleIds).size) 
			throw new UnprocessableEntityException({ message: this.i18n.t("message.user.roles_invalid"), error: { roleIds: [this.i18n.t("message.user.roles_invalid")] } });
	}

	private async ensureInstitute(id: string) {
		const institute = await prisma.institute.findFirst({ where: { id, deletedAt: null, status: "ACTIVE" }, select: { id: true } });
		if (!institute) throw new UnprocessableEntityException({ message: this.i18n.t("message.institute.not_found"), error: { instituteId: [this.i18n.t("message.institute.not_found")] } });
	}

	async create(dto: CreateUserDto, instituteId: string): Promise<void> {
		await this.ensureInstitute(instituteId);
		const existing = await UserRepository().findByMail(dto.email);

		if (existing) throw new UnprocessableEntityException({ message: this.i18n.t("message.user.email_exists"), error: { email: [this.i18n.t("message.user.email_exists")] } });
		
		await this.validateRolesForInstitute(dto.roleIds, instituteId);
		const password = await HashUtils.generateHash(dto.password);
		
		const token = await prisma.$transaction(async (tx) => {

			const user = await tx.user.create({ data: { email: dto.email, name: dto.name, password, status: dto.status } });
			await tx.instituteMembership.create({ data: { userId: user.id, instituteId } });

			const verificationToken = StrUtils.random(255);
			await tx.emailVerification.create({ data: { userId: user.id, token: verificationToken, expiresAt: emailVerificationLifetime() } });
			
			if (dto.roleIds.length) {
				const membership = await tx.instituteMembership.findUniqueOrThrow({ where: { idx_user_institute_membership: { userId: user.id, instituteId } }, select: { id: true } });
				await tx.userRole.createMany({ data: dto.roleIds.map((roleId) => ({ userId: user.id, membershipId: membership.id, roleId })) });
			}

			return verificationToken;
		});

		await this.mailService.sendMail({ subject: this.i18n.t("email.verify_email.subject"), to: dto.email, template: "auth/verify-email", context: { name: dto.name, verifyUrl: `${getEnv().FRONTEND_URL}/verify-email?token=${token}` } });
	}

	async resendVerificationEmail(id: string, instituteId: string): Promise<void> {
		const user = await UserRepository().user.findFirst({ where: { id, deletedAt: null, memberships: { some: { instituteId, status: "ACTIVE" } } }, select: { id: true, name: true, email: true, emailVerifiedAt: true } });
		
		if (!user) return;
		
		if (user.emailVerifiedAt) throw new UnprocessableEntityException({ message: this.i18n.t("message.user.email_already_verified"), error: { email: [this.i18n.t("message.user.email_already_verified")] } });
		const token = StrUtils.random(255);
		
		await prisma.emailVerification.create({ data: { userId: user.id, token, expiresAt: DateUtils.addHours(DateUtils.now(), 2).toDate() } });
		
		await this.mailService.sendMail({ subject: this.i18n.t("email.verify_email.subject"), to: user.email, template: "auth/verify-email", context: { name: user.name, verifyUrl: `${getEnv().FRONTEND_URL}/verify-email?token=${token}` } });
	}

	findAll(query: DatatableType, instituteId: string): Promise<PaginationResponse<UserList>> { return UserRepository().findAll(query, instituteId); }

	async findOne(id: string, instituteId: string): Promise<UserDetail> {
		const data = await UserRepository().findOne(id, instituteId);
		if (!data) throw new NotFoundException(this.i18n.t("message.user.not_found", { args: { id } }));
		return data;
	}

	async update(id: string, dto: UpdateUserDto, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		const existing = await UserRepository().findByMail(dto.email);
		if (existing && existing.id !== id) throw new UnprocessableEntityException({ message: this.i18n.t("message.user.email_exists"), error: { email: [this.i18n.t("message.user.email_exists")] } });
		await this.validateRolesForInstitute(dto.roleIds, instituteId);
		
		await prisma.$transaction(async (tx) => {
			await tx.user.update({ where: { id }, data: { email: dto.email, name: dto.name, status: dto.status } });
			const membership = await tx.instituteMembership.findUniqueOrThrow({ where: { idx_user_institute_membership: { userId: id, instituteId } }, select: { id: true } });
			await tx.userRole.deleteMany({ where: { membershipId: membership.id } });
			if (dto.roleIds.length) await tx.userRole.createMany({ data: dto.roleIds.map((roleId) => ({ userId: id, membershipId: membership.id, roleId })) });
		});
		await this.cacheService.del(UserCache(id));
	}

	async remove(id: string, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		await prisma.user.update({ where: { id }, data: { deletedAt: DateUtils.now().toDate() } });
		await this.cacheService.del(UserCache(id));
	}

	async updateStatus(id: string, data: UpdateStatusDto, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		await prisma.user.update({ where: { id }, data: { status: data.status } });
		await this.cacheService.del(UserCache(id));
	}

	async updatePassword(id: string, data: UpdatePasswordDto, instituteId: string): Promise<void> {
		await this.findOne(id, instituteId);
		await prisma.user.update({ where: { id }, data: { password: await HashUtils.generateHash(data.newPassword) } });
	}

	async sendForgotPasswordEmail(id: string, instituteId: string): Promise<void> {
		const user = await UserRepository().findOne(id, instituteId);
		if (!user) return;
		const token = StrUtils.random(255);
		await prisma.resetPassword.create({ data: { userId: user.id, token, expiresAt: DateUtils.addHours(DateUtils.now(), 2).toDate() } });
		await this.mailService.sendMail({ subject: this.i18n.t("email.forgot_password.subject"), to: user.email, template: "auth/forgot-password", context: { name: user.name, resetUrl: `${getEnv().FRONTEND_URL}/reset-password?token=${token}` } });
	}
}
