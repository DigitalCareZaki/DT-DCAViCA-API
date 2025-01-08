-- CreateTable
CREATE TABLE "PatientReadingRange" (
    "id" TEXT NOT NULL,
    "ecg" DOUBLE PRECISION[],
    "spo2" DOUBLE PRECISION[],
    "blood_pressure" DOUBLE PRECISION[],
    "blood_glucose" DOUBLE PRECISION[],
    "temperature" DOUBLE PRECISION[],
    "patient_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientReadingRange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientReadingRange" ADD CONSTRAINT "PatientReadingRange_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
