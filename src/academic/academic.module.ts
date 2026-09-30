import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { DepartmentsModule } from "./departments/departments.module";
import { ProgramsModule } from './programs/programs.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { SemestersModule } from './semesters/semesters.module';

@Module({
	imports: [
		DepartmentsModule,
		ProgramsModule,
		AcademicYearsModule,
		SemestersModule,
		RouterModule.register(
			[
				{ path: "academic", module: DepartmentsModule },
				{ path: "academic", module: ProgramsModule },
				{ path: "academic", module: AcademicYearsModule },
				{ path: "academic", module: SemestersModule },
			]),

	],
})
export class AcademicModule { }
