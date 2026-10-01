import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsPositive, IsString, IsUUID, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateCourseDto {
	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(50)
	@ApiProperty({ example: "CS101" })
	code!: string;

	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(255)
	@ApiProperty({ example: "Introduction to Computer Science" })
	title!: string;

	@IsInt()
	@IsPositive()
	@ApiProperty({ example: 3 })
	creditUnits!: number;

	@IsUUID()
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
	departmentId!: string;
}
