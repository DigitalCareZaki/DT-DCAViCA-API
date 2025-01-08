/*
  Warnings:

  - The values [Temperature] on the enum `MeasurementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MeasurementType_new" AS ENUM ('ECG', 'BLOODPRESSURE', 'SPO2', 'TEMPERATURE');
ALTER TABLE "Measurement" ALTER COLUMN "type" TYPE "MeasurementType_new" USING ("type"::text::"MeasurementType_new");
ALTER TYPE "MeasurementType" RENAME TO "MeasurementType_old";
ALTER TYPE "MeasurementType_new" RENAME TO "MeasurementType";
DROP TYPE "MeasurementType_old";
COMMIT;
