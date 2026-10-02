import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateStudentDto {
  @IsUUID()
  @IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
  @ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
  userId!: string;

  @IsString({ message: i18nValidationMessage("validation.IS_STRING") })
  @IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
  @MaxLength(50)
  @ApiProperty({ example: "STU-2026-001" })
  studentNumber!: string;

  @IsString({ message: i18nValidationMessage("validation.IS_STRING") })
  @IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
  @MaxLength(100)
  @ApiProperty({ example: "John" })
  firstName!: string;

  @IsString({ message: i18nValidationMessage("validation.IS_STRING") })
  @IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
  @MaxLength(100)
  @ApiProperty({ example: "Doe" })
  lastName!: string;

  @IsUUID()
  @IsNotEmpty({ message: i18nValidationMessage("validation.NOT_EMPTY") })
  @ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
  programId!: string;
}
