-- AlterTable
ALTER TABLE "Tablet" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "Tablet" ADD CONSTRAINT "Tablet_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
