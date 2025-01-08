/*
  Warnings:

  - You are about to drop the `PatientReadingRange` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientReadingRange" DROP CONSTRAINT "PatientReadingRange_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "PatientReadingRange" DROP CONSTRAINT "PatientReadingRange_user_id_fkey";

-- DropTable
DROP TABLE "PatientReadingRange";

-- CreateTable
CREATE TABLE "PatientMeasurementRange" (
    "id" TEXT NOT NULL,
    "type" "MeasurementType" NOT NULL,
    "range" DOUBLE PRECISION[],
    "user_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "send_sms" BOOLEAN NOT NULL DEFAULT false,
    "send_email" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMeasurementRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientMeasurementRange_user_id_key" ON "PatientMeasurementRange"("user_id");

-- AddForeignKey
ALTER TABLE "PatientMeasurementRange" ADD CONSTRAINT "PatientMeasurementRange_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMeasurementRange" ADD CONSTRAINT "PatientMeasurementRange_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
