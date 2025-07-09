/*
  Warnings:

  - Changed the type of `alert_time` on the `PatientMedicationAlerts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PatientMedicationAlerts" DROP COLUMN "alert_time",
ADD COLUMN     "alert_time" TIMESTAMP(3) NOT NULL;
