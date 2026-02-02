-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "site_id" TEXT,
ADD COLUMN     "vivalinkId" TEXT;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
