-- AlterTable
ALTER TABLE "OrganizationMedication" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "OrganizationMedication" ADD CONSTRAINT "OrganizationMedication_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
