import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { DepartmentsModule } from "./departments/departments.module";

@Module({
	imports: [
		DepartmentsModule,
		RouterModule.register([{ path: "academic", module: DepartmentsModule }]),
	],
})
export class AcademicModule { }
