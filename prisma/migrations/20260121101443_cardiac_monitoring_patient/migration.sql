-- CreateEnum
CREATE TYPE "VivalinkSyncStatus" AS ENUM ('YES', 'NO', 'LATER');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "cardiac_monitoring" "VivalinkSyncStatus" NOT NULL DEFAULT 'NO',
ADD COLUMN     "vivalink_sync_error" TEXT,
ADD COLUMN     "vivalink_synced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vivalink_synced_at" TIMESTAMP(3);