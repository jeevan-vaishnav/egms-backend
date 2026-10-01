import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { DepartmentsModule } from "./departments/departments.module";
import { ProgramsModule } from './programs/programs.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { SemestersModule } from './semesters/semesters.module';
import { CoursesModule } from './courses/courses.module';

@Module({
	imports: [
		DepartmentsModule,
		ProgramsModule,
		AcademicYearsModule,
		SemestersModule,
		CoursesModule,
		RouterModule.register(
			[
				{ path: "academic", module: DepartmentsModule },
				{ path: "academic", module: ProgramsModule },
				{ path: "academic", module: AcademicYearsModule },
				{ path: "academic", module: SemestersModule },
				{ path: "academic", module: CoursesModule },
			]),


	],
})
export class AcademicModule { }
