/*
  Warnings:

  - You are about to drop the column `status` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the `_appointmentParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "_appointmentParticipants" DROP CONSTRAINT "_appointmentParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_appointmentParticipants" DROP CONSTRAINT "_appointmentParticipants_B_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "status";

-- DropTable
DROP TABLE "_appointmentParticipants";

-- CreateTable
CREATE TABLE "AppointmentParticipants" (
    "id" TEXT NOT NULL,
    "status" "AppointmentStatus",
    "user_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentParticipants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppointmentParticipants" ADD CONSTRAINT "AppointmentParticipants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentParticipants" ADD CONSTRAINT "AppointmentParticipants_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
