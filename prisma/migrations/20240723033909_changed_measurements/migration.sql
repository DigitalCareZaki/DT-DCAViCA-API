/*
  Warnings:

  - The values [MILLIMETERS,MILLISECONDS] on the enum `MeasurementUnit` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "MeasurementType" ADD VALUE 'BLOODGLUCOSE';

-- AlterEnum
BEGIN;
CREATE TYPE "MeasurementUnit_new" AS ENUM ('VOLTAGE', 'PERCENTAGE', 'MMHG', 'MGDL', 'DEGREE', 'FAHRENHEIT');
ALTER TABLE "Measurement" ALTER COLUMN "unit" TYPE "MeasurementUnit_new" USING ("unit"::text::"MeasurementUnit_new");
ALTER TYPE "MeasurementUnit" RENAME TO "MeasurementUnit_old";
ALTER TYPE "MeasurementUnit_new" RENAME TO "MeasurementUnit";
DROP TYPE "MeasurementUnit_old";
COMMIT;

-- AlterTable
ALTER TABLE "Measurement" ALTER COLUMN "status" DROP NOT NULL;
