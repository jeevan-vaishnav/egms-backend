import {
	DatatableType,
	PaginationResponse,
	parseDateRangeFilter,
} from "@common";
import { Prisma } from "@generated/prisma/client";
import { UserStatus } from "@generated/prisma/enums";
import { BadRequestException } from "@nestjs/common";
// import { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@repositories";
import { I18nContext } from "nestjs-i18n";

export interface UserInformation {
	id: string;
	email: string;
	name: string;
	status: UserStatus;
	createdAt: Date;
	updatedAt: Date;
	platformRoles: { name: string }[];
	memberships: {
		id: string;
		instituteId: string;
		instituteName: string;
		status: string;
		roles: { name: string; permissions: string[] }[];
	}[];
	/** Backward-compatible flattened roles. Guards use the current membership. */
	roles: {
		name: string;
		permissions: string[];
	}[];
	permissions: string[];
}

export interface UserList {
	id: string;
	email: string;
	name: string;
	status: UserStatus;
	createdAt: Date;
	updatedAt: Date;
	roles: { id: string; name: string }[];
}

export type UserDetail = Required<UserList>;

/* The ?sort= and filter[...] values this repository accepts. Exported so the
   controller can document them in Swagger from one source of truth rather than
   restating the list. An unrecognised value is rejected, not ignored. */
export const userSortableFields = [
	"id",
	"name",
	"email",
	"status",
	"createdAt",
	"updatedAt",
];
export const userFilterableFields = [
	"id",
	"name",
	"email",
	"status",
	"roles",
	"createdAt",
	"updatedAt",
];

export function UserRepository(tx?: Prisma.TransactionClient) {
	const db = tx || prisma;

	return {
		user: db.user,

		async findAll(queryParam: DatatableType, instituteId?: string): Promise<PaginationResponse<UserList>> {
			const { page, limit, search, sort, sortDirection } = queryParam;
			const finalLimit = Number(limit);
			const finalPage = Number(page);

			const sortDirectionAllowed = ["asc", "desc"];

			if (!userSortableFields.includes(sort)) {
				throw new BadRequestException(
					I18nContext.current()?.t("message.common.invalid_sort_field") ??
					"Invalid sort field",
				);
			}

			if (!sortDirectionAllowed.includes(sortDirection)) {
				throw new BadRequestException(
					I18nContext.current()?.t("message.common.invalid_sort_direction") ??
					"Invalid sort direction",
				);
			}

			if (queryParam.filter) {
				const filterKeys = Object.keys(queryParam.filter);
				for (const key of filterKeys) {
					if (!userFilterableFields.includes(key)) {
						throw new BadRequestException(
							I18nContext.current()?.t("message.common.invalid_filter_field") ??
							"Invalid filter field",
						);
					}
				}
			}

			let whereCondition: Prisma.UserWhereInput[] = [{ deletedAt: null }];
			if (instituteId) {
				whereCondition.push({ memberships: { some: { instituteId, status: "ACTIVE" } } });
			}
			if (search) {
				whereCondition.push({
					OR: [
						{ name: { contains: search, mode: "insensitive" } },
						{ email: { contains: search, mode: "insensitive" } },
					]
				})

				// whereCondition = {
				// 	...whereCondition,
				// 	AND: [
				// 		{
				// 			OR: [
				// 				{ name: { contains: search, mode: "insensitive" } },
				// 				{ email: { contains: search, mode: "insensitive" } },
				// 			],
				// 		},
				// 	],
				// };
			}

			// let filterCondition: Prisma.UserWhereInput = { deletedAt: null };
			const filter = queryParam.filter;

			if (filter?.status) {
				if (filter.status) {
					/* The key is allow-listed above; the value was not. An
					   unrecognised member cast straight to the enum reaches
					   Prisma and fails validation as a 500 — reject it here as
					   the 400 the allow-list machinery exists to produce. */
					const status = filter.status.toString();
					if (!Object.values(UserStatus).includes(status as UserStatus)) {
						throw new BadRequestException(
							I18nContext.current()?.t("message.common.invalid_filter_field") ??
							"Invalid filter field",
						);
					}

					// filterCondition = {
					// 	...filterCondition,
					// 	status: status as UserStatus,
					// };
					whereCondition.push({ status: status as UserStatus });
				}

				if (filter?.roles) {
					const roles = filter.roles.toString()
						.toString()
						.split(",")
						.map((role) => role.trim());
					whereCondition.push({ roles: { some: { ...(instituteId ? { membership: { instituteId } } : {}), role: { name: { in: roles } } } } });

				}

				if (filter?.name) whereCondition.push({ name: { contains: filter.name.toString(), mode: "insensitive" } });
				if (filter?.email) whereCondition.push({ email: { contains: filter.email.toString(), mode: "insensitive" } });
				if (filter?.createdAt && typeof filter.createdAt === "string") whereCondition.push({ createdAt: parseDateRangeFilter(filter.createdAt, "createdAt") });
				if (filter?.updatedAt && typeof filter.updatedAt === "string") whereCondition.push({ updatedAt: parseDateRangeFilter(filter.updatedAt, "updatedAt") });
			}


			const where: Prisma.UserWhereInput = { AND: whereCondition };

			const [totalCount, users] = await Promise.all([
				db.user.count({ where }),
				db.user.findMany({
					where, orderBy: { [sort]: sortDirection }, skip: (finalPage - 1) * finalLimit, take: finalLimit,
					select: {
						id: true, email: true, name: true, status: true, createdAt: true, updatedAt: true,
						roles: { where: instituteId ? { membership: { instituteId } } : undefined, select: { role: { select: { id: true, name: true } } } },
					},
				}),
			]);

			return {
				data: users.map((user) => ({ ...user, roles: user.roles.map((r) => r.role) })),
				meta: { limit: finalLimit, page: finalPage, totalCount, totalPages: Math.ceil(totalCount / finalLimit) },
			};
		},

		async findOne(id: string, instituteId?: string): Promise<UserDetail | null> {
			const data = await db.user.findFirst({
				where: { id, deletedAt: null, ...(instituteId ? { memberships: { some: { instituteId, status: "ACTIVE" } } } : {}) },
				select: { id: true, email: true, name: true, status: true, createdAt: true, updatedAt: true, roles: { where: instituteId ? { membership: { instituteId } } : undefined, select: { role: { select: { id: true, name: true } } } } },
			});
			return data ? { ...data, roles: data.roles.map((r) => r.role) } : null;
		},

		async findByMail(email: string) {
			return db.user.findFirst({ where: { email, deletedAt: null }, select: { id: true, email: true, name: true, password: true, status: true, emailVerifiedAt: true, createdAt: true, updatedAt: true } });
		},

		async userInformation(userId: string): Promise<UserInformation | null> {
			const user = await db.user.findUnique({
				where: { id: userId, deletedAt: null, emailVerifiedAt: { not: null }, status: UserStatus.ACTIVE },
				select: {
					id: true, email: true, name: true, status: true, createdAt: true, updatedAt: true,
					platformRoles: { select: { role: { select: { name: true } } } },
					memberships: {
						where: { status: "ACTIVE" },
						select: { id: true, instituteId: true, status: true, institute: { select: { name: true } }, roles: { select: { role: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } } } } },
					},
				},
			});
			
			if (!user) return null;

			const memberships = user.memberships.map((membership) => ({
				id: membership.id, instituteId: membership.instituteId, instituteName: membership.institute.name, status: membership.status,
				roles: membership.roles.map((ur) => ({ name: ur.role.name, permissions: ur.role.permissions.map((rp) => rp.permission.name) })),
			}));
			const roles = memberships.flatMap((m) => m.roles);
			const permissions = Array.from(new Set(roles.flatMap((r) => r.permissions)));
			return { ...user, platformRoles: user.platformRoles.map((r) => r.role), memberships, roles, permissions };
		},
	};
}
