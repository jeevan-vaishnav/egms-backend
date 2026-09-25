import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { CommonModule, MailModule } from "@common";

@Module({
	controllers: [AuthController],
	providers: [AuthService],
	imports: [CommonModule,MailModule],
})
export class AuthModule {}