/*
  Warnings:

  - A unique constraint covering the columns `[instituteId,name]` on the table `AcademicYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituteId,code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituteId,code]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituteId,name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituteId,staffNumber]` on the table `Lecturer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituteId,code]` on the table `Program` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituteId,studentNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[membershipId,roleId]` on the table `UserRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `instituteId` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `Lecturer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membershipId` to the `UserRole` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InstituteType" AS ENUM ('SCHOOL', 'COLLEGE', 'UNIVERSITY');

-- CreateEnum
CREATE TYPE "InstituteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- DropIndex
DROP INDEX "Department_code_key";

-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "Lecturer_staffNumber_key";

-- DropIndex
DROP INDEX "UserRole_userId_roleId_key";

-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "instituteId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "instituteId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "instituteId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Lecturer" ADD COLUMN     "instituteId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "instituteId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "instituteId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "membershipId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Institute" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "InstituteType" NOT NULL,
    "status" "InstituteStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" VARCHAR(500),
    "country" VARCHAR(100),
    "state" VARCHAR(100),
    "city" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstituteMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "instituteId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstituteMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "maxStudents" INTEGER,
    "maxUsers" INTEGER,
    "maxLecturers" INTEGER,
    "apiRequestsPerMinute" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "instituteId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institute_code_key" ON "Institute"("code");

-- CreateIndex
CREATE INDEX "idx_institute_status" ON "Institute"("status");

-- CreateIndex
CREATE INDEX "idx_institute_type" ON "Institute"("type");

-- CreateIndex
CREATE INDEX "idx_institute_deleted_at" ON "Institute"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_membership_user" ON "InstituteMembership"("userId");

-- CreateIndex
CREATE INDEX "idx_membership_institute" ON "InstituteMembership"("instituteId");

-- CreateIndex
CREATE INDEX "idx_membership_institute_status" ON "InstituteMembership"("instituteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InstituteMembership_userId_instituteId_key" ON "InstituteMembership"("userId", "instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "idx_plan_active" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "idx_subscription_institute" ON "Subscription"("instituteId");

-- CreateIndex
CREATE INDEX "idx_subscription_status" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "idx_subscription_ends_at" ON "Subscription"("endsAt");

-- CreateIndex
CREATE INDEX "idx_academic_year_institute" ON "AcademicYear"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_instituteId_name_key" ON "AcademicYear"("instituteId", "name");

-- CreateIndex
CREATE INDEX "idx_course_institute" ON "Course"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_instituteId_code_key" ON "Course"("instituteId", "code");

-- CreateIndex
CREATE INDEX "idx_department_institute" ON "Department"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_instituteId_code_key" ON "Department"("instituteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_instituteId_name_key" ON "Department"("instituteId", "name");

-- CreateIndex
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");

-- CreateIndex
CREATE INDEX "idx_lecturer_institute" ON "Lecturer"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_instituteId_staffNumber_key" ON "Lecturer"("instituteId", "staffNumber");

-- CreateIndex
CREATE INDEX "idx_permission_group" ON "Permission"("group");

-- CreateIndex
CREATE INDEX "idx_program_institute" ON "Program"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_instituteId_code_key" ON "Program"("instituteId", "code");

-- CreateIndex
CREATE INDEX "ResetPassword_userId_idx" ON "ResetPassword"("userId");

-- CreateIndex
CREATE INDEX "idx_semester_academic_year" ON "Semester"("academicYearId");

-- CreateIndex
CREATE INDEX "idx_student_institute" ON "Student"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_instituteId_studentNumber_key" ON "Student"("instituteId", "studentNumber");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "User"("status");

-- CreateIndex
CREATE INDEX "idx_user_role_user" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "idx_user_role_role" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_membershipId_roleId_key" ON "UserRole"("membershipId", "roleId");

-- AddForeignKey
ALTER TABLE "InstituteMembership" ADD CONSTRAINT "InstituteMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstituteMembership" ADD CONSTRAINT "InstituteMembership_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "InstituteMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Course_departmentId_idx" RENAME TO "idx_course_department";

-- RenameIndex
ALTER INDEX "CourseRegistration_courseId_idx" RENAME TO "idx_registration_course";

-- RenameIndex
ALTER INDEX "CourseRegistration_semesterId_idx" RENAME TO "idx_registration_semester";

-- RenameIndex
ALTER INDEX "CourseRegistration_studentId_idx" RENAME TO "idx_registration_student";

-- RenameIndex
ALTER INDEX "Lecturer_departmentId_idx" RENAME TO "idx_lecturer_department";

-- RenameIndex
ALTER INDEX "LecturerAssignment_courseId_idx" RENAME TO "idx_assignment_course";

-- RenameIndex
ALTER INDEX "LecturerAssignment_lecturerId_idx" RENAME TO "idx_assignment_lecturer";

-- RenameIndex
ALTER INDEX "LecturerAssignment_semesterId_idx" RENAME TO "idx_assignment_semester";

-- RenameIndex
ALTER INDEX "Program_departmentId_idx" RENAME TO "idx_program_department";

-- RenameIndex
ALTER INDEX "Student_programId_idx" RENAME TO "idx_student_program";
