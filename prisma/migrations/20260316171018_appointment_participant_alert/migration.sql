-- AlterEnum
ALTER TYPE "RolePlatform" ADD VALUE 'VL';

-- AlterTable
ALTER TABLE "AppointmentParticipants" ADD COLUMN     "notification_sent" BOOLEAN NOT NULL DEFAULT false;
