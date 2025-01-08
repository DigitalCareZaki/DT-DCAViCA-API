/*
  Warnings:

  - You are about to drop the column `viva_link_serial` on the `Device` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serial_number]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serial_number` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Device_viva_link_serial_idx";

-- DropIndex
DROP INDEX "Device_viva_link_serial_key";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "viva_link_serial",
ADD COLUMN     "serial_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Device_serial_number_key" ON "Device"("serial_number");

-- CreateIndex
CREATE INDEX "Device_serial_number_idx" ON "Device" USING HASH ("serial_number");
