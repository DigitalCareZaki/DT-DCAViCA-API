/*
  Warnings:

  - You are about to drop the column `amount` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Medication` table. All the data in the column will be lost.
  - Added the required column `end_utc` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_utc` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_utc` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `unit` on the `Medication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MedicationUnit" AS ENUM ('TABLET', 'CAPSULE', 'SOFTGEL', 'TEASPOON', 'TABLESPOON');

-- CreateEnum
CREATE TYPE "MedicationTaken" AS ENUM ('TAKEN', 'NOT_TAKEN', 'PENDING', 'MISSED');

-- DropIndex
DROP INDEX "Medication_frequency_idx";

-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "amount",
DROP COLUMN "end",
DROP COLUMN "start",
DROP COLUMN "time",
ADD COLUMN     "end_utc" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_utc" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "taken" "MedicationTaken" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "time_utc" TIMESTAMP(3) NOT NULL,
DROP COLUMN "unit",
ADD COLUMN     "unit" "MedicationUnit" NOT NULL;

-- CreateTable
CREATE TABLE "OrganizationMedication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMedication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Medication_start_utc_idx" ON "Medication"("start_utc");

-- CreateIndex
CREATE INDEX "Medication_end_utc_idx" ON "Medication"("end_utc");

-- AddForeignKey
ALTER TABLE "OrganizationMedication" ADD CONSTRAINT "OrganizationMedication_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
