-- CreateEnum
CREATE TYPE "RolePlatform" AS ENUM ('WEB', 'MOBILE');

-- AlterTable
ALTER TABLE "Logs" ADD COLUMN     "platform" "RolePlatform" NOT NULL DEFAULT 'WEB';
