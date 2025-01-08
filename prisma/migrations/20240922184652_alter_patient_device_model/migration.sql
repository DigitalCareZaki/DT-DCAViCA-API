/*
  Warnings:

  - You are about to drop the column `patient_id` on the `PatientDevice` table. All the data in the column will be lost.
  - Added the required column `patient_user_id` to the `PatientDevice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PatientDevice" DROP CONSTRAINT "PatientDevice_patient_id_fkey";

-- AlterTable
ALTER TABLE "PatientDevice" DROP COLUMN "patient_id",
ADD COLUMN     "patient_user_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PatientDevice" ADD CONSTRAINT "PatientDevice_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "Patient"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
