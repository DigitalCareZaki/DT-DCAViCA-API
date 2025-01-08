/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `PatientReadingRange` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `PatientReadingRange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PatientReadingRange" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PatientReadingRange_user_id_key" ON "PatientReadingRange"("user_id");

-- AddForeignKey
ALTER TABLE "PatientReadingRange" ADD CONSTRAINT "PatientReadingRange_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
