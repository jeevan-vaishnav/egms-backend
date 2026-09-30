import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateProgramDto {
	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(50)
	@ApiProperty({ example: "BSC-CS" })
	code!: string;

	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(255)
	@ApiProperty({ example: "Bachelor of Science in Computer Science" })
	name!: string;

	@IsUUID()
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
	departmentId!: string;
}
