/*
  Warnings:

  - You are about to drop the column `userId` on the `Contacts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contacts" DROP CONSTRAINT "Contacts_userId_fkey";

-- AlterTable
ALTER TABLE "Contacts" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
