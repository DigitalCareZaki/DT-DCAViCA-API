/*
  Warnings:

  - Added the required column `unit` to the `Measurement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('DEGREE', 'FAHRENHEIT', 'MILLIMETERS', 'MILLISECONDS', 'VOLTAGE', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "unit" "MeasurementUnit" NOT NULL;
