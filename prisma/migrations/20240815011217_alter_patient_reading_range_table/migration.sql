/*
  Warnings:

  - You are about to drop the column `blood_glucose` on the `PatientReadingRange` table. All the data in the column will be lost.
  - You are about to drop the column `blood_pressure` on the `PatientReadingRange` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientReadingRange" DROP COLUMN "blood_glucose",
DROP COLUMN "blood_pressure",
ADD COLUMN     "bloodglucose" DOUBLE PRECISION[],
ADD COLUMN     "bloodpressure" DOUBLE PRECISION[];
