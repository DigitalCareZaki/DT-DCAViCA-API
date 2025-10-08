-- AlterTable
ALTER TABLE "OrganizationMedication" ADD COLUMN     "added_by" TEXT;

-- AddForeignKey
ALTER TABLE "OrganizationMedication" ADD CONSTRAINT "OrganizationMedication_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
