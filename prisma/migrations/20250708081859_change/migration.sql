/*
  Warnings:

  - The `time` column on the `Medication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `alert_time` column on the `PatientMedicationAlerts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "time",
ADD COLUMN     "time" TEXT[];

-- AlterTable
ALTER TABLE "PatientMedicationAlerts" DROP COLUMN "alert_time",
ADD COLUMN     "alert_time" TEXT[];
