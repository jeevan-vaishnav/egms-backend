-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'HOD_REVIEW', 'HOD_RETURNED', 'HOD_APPROVED', 'DEAN_REVIEW', 'DEAN_RETURNED', 'DEAN_APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "GradeComponentType" AS ENUM ('ATTENDANCE', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'MIDTERM', 'FINAL');

-- CreateTable
CREATE TABLE "Grade" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "totalScore" DECIMAL(5,2),
    "letterGrade" VARCHAR(5),
    "status" "GradeStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeComponent" (
    "id" UUID NOT NULL,
    "gradeId" UUID NOT NULL,
    "type" "GradeComponentType" NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "maxScore" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_registrationId_key" ON "Grade"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeComponent_gradeId_type_key" ON "GradeComponent"("gradeId", "type");

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "CourseRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LecturerAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeComponent" ADD CONSTRAINT "GradeComponent_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
