/*
  Warnings:

  - Added the required column `department_id` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Branch_created_by_key";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "department_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
