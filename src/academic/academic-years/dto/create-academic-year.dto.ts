import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateAcademicYearDto {
	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@MaxLength(20)
	@ApiProperty({ example: "2026/2027" })
	name!: string;

	@IsInt()
	@Min(1900)
	@ApiProperty({ example: 2026 })
	startYear!: number;

	@IsInt()
	@Min(1900)
	@ApiProperty({ example: 2027 })
	endYear!: number;
}
