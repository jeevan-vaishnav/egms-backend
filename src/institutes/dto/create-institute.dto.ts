import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, IsNotEmpty } from "class-validator";
import { InstituteType } from "@generated/prisma/client";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateInstituteDto {
	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@ApiProperty({ example: "UCS-001" })
	code!: string;

	@IsString({ message: i18nValidationMessage("validation.IS_STRING") })
	@IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
	@ApiProperty({ example: "University College of Science & Technology" })
	name!: string;

	@IsEnum(InstituteType, { message: i18nValidationMessage("validation.IS_ENUM") })
	@ApiProperty({ enum: InstituteType, example: InstituteType.UNIVERSITY })
	type!: InstituteType;

	@IsOptional() @IsEmail({}, { message: i18nValidationMessage("validation.IS_EMAIL") })
	@ApiPropertyOptional({ example: "admin@institute.edu" })
	email?: string;
	@IsOptional() @IsString() @ApiPropertyOptional() phone?: string;
	@IsOptional() @IsString() @ApiPropertyOptional() address?: string;
	@IsOptional() @IsString() @ApiPropertyOptional() country?: string;
	@IsOptional() @IsString() @ApiPropertyOptional() state?: string;
	@IsOptional() @IsString() @ApiPropertyOptional() city?: string;
}
