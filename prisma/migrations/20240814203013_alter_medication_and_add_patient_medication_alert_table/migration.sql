/*
  Warnings:

  - You are about to drop the column `taken` on the `Medication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "taken";

-- CreateTable
CREATE TABLE "PatientMedicationAlerts" (
    "id" TEXT NOT NULL,
    "alert_time" TIMESTAMP(3) NOT NULL,
    "taken" "MedicationTaken" NOT NULL DEFAULT 'PENDING',
    "medication_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientMedicationAlerts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientMedicationAlerts" ADD CONSTRAINT "PatientMedicationAlerts_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
