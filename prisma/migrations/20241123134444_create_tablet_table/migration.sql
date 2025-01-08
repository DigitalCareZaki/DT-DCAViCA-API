-- CreateTable
CREATE TABLE "Tablet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "uri" TEXT,
    "category" "MeasurementType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tablet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientTablet" (
    "id" TEXT NOT NULL,
    "tablet_id" TEXT NOT NULL,
    "issued_to_user_id" TEXT NOT NULL,
    "issued_by_user_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientTablet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tablet_serial_number_key" ON "Tablet"("serial_number");

-- CreateIndex
CREATE INDEX "Tablet_serial_number_idx" ON "Tablet" USING HASH ("serial_number");

-- AddForeignKey
ALTER TABLE "Tablet" ADD CONSTRAINT "Tablet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTablet" ADD CONSTRAINT "PatientTablet_tablet_id_fkey" FOREIGN KEY ("tablet_id") REFERENCES "Tablet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTablet" ADD CONSTRAINT "PatientTablet_issued_to_user_id_fkey" FOREIGN KEY ("issued_to_user_id") REFERENCES "Patient"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTablet" ADD CONSTRAINT "PatientTablet_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
