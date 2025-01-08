/*
  Warnings:

  - You are about to drop the column `department_id` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `speciality_id` on the `Doctor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_department_id_fkey";

-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_speciality_id_fkey";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "department_id",
DROP COLUMN "speciality_id";

-- CreateTable
CREATE TABLE "_doctorDepartment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_doctorSpecilization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_doctorDepartment_AB_unique" ON "_doctorDepartment"("A", "B");

-- CreateIndex
CREATE INDEX "_doctorDepartment_B_index" ON "_doctorDepartment"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_doctorSpecilization_AB_unique" ON "_doctorSpecilization"("A", "B");

-- CreateIndex
CREATE INDEX "_doctorSpecilization_B_index" ON "_doctorSpecilization"("B");

-- AddForeignKey
ALTER TABLE "_doctorDepartment" ADD CONSTRAINT "_doctorDepartment_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_doctorDepartment" ADD CONSTRAINT "_doctorDepartment_B_fkey" FOREIGN KEY ("B") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_doctorSpecilization" ADD CONSTRAINT "_doctorSpecilization_A_fkey" FOREIGN KEY ("A") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_doctorSpecilization" ADD CONSTRAINT "_doctorSpecilization_B_fkey" FOREIGN KEY ("B") REFERENCES "Specialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
