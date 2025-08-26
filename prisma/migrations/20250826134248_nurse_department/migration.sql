/*
  Warnings:

  - You are about to drop the column `department_id` on the `Nurse` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Nurse" DROP CONSTRAINT "Nurse_department_id_fkey";

-- AlterTable
ALTER TABLE "Nurse" DROP COLUMN "department_id";

-- CreateTable
CREATE TABLE "_nurseDepartment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_nurseDepartment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_nurseDepartment_B_index" ON "_nurseDepartment"("B");

-- AddForeignKey
ALTER TABLE "_nurseDepartment" ADD CONSTRAINT "_nurseDepartment_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_nurseDepartment" ADD CONSTRAINT "_nurseDepartment_B_fkey" FOREIGN KEY ("B") REFERENCES "Nurse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
