/*
  Warnings:

  - You are about to drop the `MedicineDosage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dosage` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MedicineDosage" DROP CONSTRAINT "MedicineDosage_medication_id_fkey";

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "amount" TEXT NOT NULL,
ADD COLUMN     "dosage" TEXT NOT NULL,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;

-- DropTable
DROP TABLE "MedicineDosage";
