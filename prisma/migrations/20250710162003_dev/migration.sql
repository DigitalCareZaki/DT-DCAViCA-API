/*
  Warnings:

  - The values [PARENT_HISTORY] on the enum `EMRType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EMRType_new" AS ENUM ('FAMILY_HISTORY', 'PATIENT_HISTORY', 'SURGICAL_HISTORY', 'MEDICATION_HISTORY', 'DIAGNOSIS', 'RECORD');
ALTER TABLE "ElectronicMedicalReport" ALTER COLUMN "type" TYPE "EMRType_new" USING ("type"::text::"EMRType_new");
ALTER TYPE "EMRType" RENAME TO "EMRType_old";
ALTER TYPE "EMRType_new" RENAME TO "EMRType";
DROP TYPE "EMRType_old";
COMMIT;
