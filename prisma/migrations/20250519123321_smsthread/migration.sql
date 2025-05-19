-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "_nurseSpecilization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_nurseSpecilization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_nurseSpecilization_B_index" ON "_nurseSpecilization"("B");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_nurseSpecilization" ADD CONSTRAINT "_nurseSpecilization_A_fkey" FOREIGN KEY ("A") REFERENCES "Nurse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_nurseSpecilization" ADD CONSTRAINT "_nurseSpecilization_B_fkey" FOREIGN KEY ("B") REFERENCES "Specialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
