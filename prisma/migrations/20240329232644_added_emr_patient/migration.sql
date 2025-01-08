/*
  Warnings:

  - A unique constraint covering the columns `[emr]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - The required column `emr` was added to the `Patient` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "emr" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_emr_key" ON "Patient"("emr");
