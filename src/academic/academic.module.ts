import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { DepartmentsModule } from "./departments/departments.module";
import { ProgramsModule } from './programs/programs.module';

@Module({
	imports: [
		DepartmentsModule,
		ProgramsModule,
		RouterModule.register(
			[
				{ path: "academic", module: DepartmentsModule },
				{ path: "academic", module: ProgramsModule },
			]),

	],
})
export class AcademicModule { }
