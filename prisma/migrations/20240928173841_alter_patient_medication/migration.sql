/*
  Warnings:

  - You are about to drop the column `patient_user_id` on the `PatientDevice` table. All the data in the column will be lost.
  - Added the required column `issued_to_user_id` to the `PatientDevice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PatientDevice" DROP CONSTRAINT "PatientDevice_patient_user_id_fkey";

-- AlterTable
ALTER TABLE "PatientDevice" DROP COLUMN "patient_user_id",
ADD COLUMN     "issued_to_user_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PatientDevice" ADD CONSTRAINT "PatientDevice_issued_to_user_id_fkey" FOREIGN KEY ("issued_to_user_id") REFERENCES "Patient"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
