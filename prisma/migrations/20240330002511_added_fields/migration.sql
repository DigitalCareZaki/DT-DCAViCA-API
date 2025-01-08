-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserMetaData" ADD COLUMN     "timezone" TEXT;
