-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "avicardia_monitoring" "VivalinkSyncStatus" NOT NULL DEFAULT 'NO',
ADD COLUMN     "site_id" TEXT,
ADD COLUMN     "vivalink_sync_error" TEXT,
ADD COLUMN     "vivalink_synced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vivalink_synced_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
