/*
  Warnings:

  - You are about to drop the column `department_id` on the `Department` table. All the data in the column will be lost.
  - Added the required column `barnch_id` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_department_id_fkey";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "department_id",
ADD COLUMN     "barnch_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_barnch_id_fkey" FOREIGN KEY ("barnch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
