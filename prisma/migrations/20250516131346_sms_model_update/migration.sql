/*
  Warnings:

  - You are about to drop the column `reciever_id` on the `Sms` table. All the data in the column will be lost.
  - Added the required column `receiver_id` to the `Sms` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sms" DROP CONSTRAINT "Sms_reciever_id_fkey";

-- AlterTable
ALTER TABLE "Sms" DROP COLUMN "reciever_id",
ADD COLUMN     "receiver_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Sms" ADD CONSTRAINT "Sms_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
