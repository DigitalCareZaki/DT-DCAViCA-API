/*
  Warnings:

  - You are about to drop the `SmsLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "SmsLog";

-- CreateTable
CREATE TABLE "Sms" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "reciever_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sms_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sms" ADD CONSTRAINT "Sms_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sms" ADD CONSTRAINT "Sms_reciever_id_fkey" FOREIGN KEY ("reciever_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
