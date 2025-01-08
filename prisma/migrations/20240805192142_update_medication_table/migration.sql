/*
  Warnings:

  - You are about to drop the column `end_utc` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `start_utc` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `time_utc` on the `Medication` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Medication_end_utc_idx";

-- DropIndex
DROP INDEX "Medication_start_utc_idx";

-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "end_utc",
DROP COLUMN "start_utc",
DROP COLUMN "time_utc",
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Medication_start_date_idx" ON "Medication"("start_date");

-- CreateIndex
CREATE INDEX "Medication_end_date_idx" ON "Medication"("end_date");
