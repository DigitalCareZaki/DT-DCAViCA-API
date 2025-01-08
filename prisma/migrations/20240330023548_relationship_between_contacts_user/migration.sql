/*
  Warnings:

  - You are about to drop the `_userContacts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Contacts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_userContacts" DROP CONSTRAINT "_userContacts_A_fkey";

-- DropForeignKey
ALTER TABLE "_userContacts" DROP CONSTRAINT "_userContacts_B_fkey";

-- AlterTable
ALTER TABLE "Contacts" ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "_userContacts";

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
