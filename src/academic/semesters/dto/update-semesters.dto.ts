import { PartialType } from "@nestjs/swagger";
import { CreateSemesterDto } from "./create-semesters.dto";


export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}
