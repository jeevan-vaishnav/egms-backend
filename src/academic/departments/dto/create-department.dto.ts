import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateDepartmentDto {
	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(50)
	@ApiProperty({ example: "CS" })
	code!: string;

	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(255)
	@ApiProperty({ example: "Computer Science" })
	name!: string;
}
