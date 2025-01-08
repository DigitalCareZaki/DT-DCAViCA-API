/*
  Warnings:

  - You are about to drop the column `userId` on the `Views` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Views" DROP CONSTRAINT "Views_userId_fkey";

-- AlterTable
ALTER TABLE "Views" DROP COLUMN "userId";
