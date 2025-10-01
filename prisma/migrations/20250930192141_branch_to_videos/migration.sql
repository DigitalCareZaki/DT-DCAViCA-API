-- AlterTable
ALTER TABLE "Videos" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "Videos" ADD CONSTRAINT "Videos_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
