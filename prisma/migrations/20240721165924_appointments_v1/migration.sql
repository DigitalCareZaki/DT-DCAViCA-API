-- CreateEnum
CREATE TYPE "AppointmentAbout" AS ENUM ('EMERGENCY', 'CONSULTANCY', 'CHECKUP', 'CASUAL');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "about" "AppointmentAbout" NOT NULL DEFAULT 'CASUAL',
ADD COLUMN     "notes" TEXT[];

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "appointment_id" TEXT;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
