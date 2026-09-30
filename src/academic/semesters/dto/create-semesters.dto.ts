import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { SemesterType } from "@generated/prisma/client";

export class CreateSemesterDto {
	@IsEnum(SemesterType)
	@ApiProperty({ enum: SemesterType, example: SemesterType.FIRST })
	name!: SemesterType;

	@IsUUID("4", { message: i18nValidationMessage("validation.IS_UUID") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@ApiProperty({ example: "00000000-0000-4000-8000-000000000000" })
	academicYearId!: string;
}
