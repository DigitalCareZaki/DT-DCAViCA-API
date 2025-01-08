-- CreateTable
CREATE TABLE "ElectronicMedicalReport" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "family_history" TEXT,
    "uri" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicMedicalReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ElectronicMedicalReport" ADD CONSTRAINT "ElectronicMedicalReport_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
