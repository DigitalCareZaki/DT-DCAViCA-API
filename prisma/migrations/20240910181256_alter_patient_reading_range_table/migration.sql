-- AlterTable
ALTER TABLE "PatientReadingRange" ADD COLUMN     "send_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "send_sms" BOOLEAN NOT NULL DEFAULT false;
