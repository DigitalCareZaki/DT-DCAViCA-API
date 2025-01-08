/*
  Warnings:

  - You are about to drop the `Reading` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReadingType` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MeasurementReadingSource" AS ENUM ('MANUAL', 'AUTOMATIC');

-- DropForeignKey
ALTER TABLE "Reading" DROP CONSTRAINT "Reading_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Reading" DROP CONSTRAINT "Reading_patient_id_fkey";

-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "reading_source" "MeasurementReadingSource" NOT NULL DEFAULT 'MANUAL';

-- DropTable
DROP TABLE "Reading";

-- DropTable
DROP TABLE "ReadingType";
