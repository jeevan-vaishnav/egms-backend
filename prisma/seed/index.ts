import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/prisma/client";
import { HashUtils } from "@utils";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
	const email = process.env.SUPER_ADMIN_EMAIL;
	const password = process.env.SUPER_ADMIN_PASSWORD;
	const name = process.env.SUPER_ADMIN_NAME ?? "EGMS Super Admin";
	if (!email || !password) throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required");

	const role = await prisma.platformRole.upsert({ where: { name: "SUPER_ADMIN" }, update: {}, create: { name: "SUPER_ADMIN" } });
	const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
	if (!user) {
		const created = await prisma.user.create({ data: { email, name, password: await HashUtils.generateHash(password), emailVerifiedAt: new Date() } });
		await prisma.platformUserRole.create({ data: { userId: created.id, roleId: role.id } });
		console.log(`Created SUPER_ADMIN user: ${email}`);
	} else {
		await prisma.platformUserRole.upsert({ where: { idx_platform_user_role_unique: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
		console.log(`Assigned SUPER_ADMIN to existing user: ${email}`);
	}
}

main().finally(() => prisma.$disconnect());
