-- AlterTable
ALTER TABLE "Nurse" ADD COLUMN     "site_id" TEXT;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "site_id" TEXT;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
