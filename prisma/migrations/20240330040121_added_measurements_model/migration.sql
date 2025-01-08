-- CreateEnum
CREATE TYPE "MeasurementStatus" AS ENUM ('HIGH', 'LOW', 'NORMAL');

-- CreateEnum
CREATE TYPE "MeasurementMode" AS ENUM ('METRIC');

-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('ECG', 'BLOODPRESSURE', 'SPO2', 'Temperature');

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "MeasurementStatus" NOT NULL,
    "mode" "MeasurementMode" NOT NULL DEFAULT 'METRIC',
    "type" "MeasurementType" NOT NULL,
    "values" DOUBLE PRECISION[],
    "patient_id" TEXT NOT NULL,
    "nurse_id" TEXT,
    "doctor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "Nurse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
