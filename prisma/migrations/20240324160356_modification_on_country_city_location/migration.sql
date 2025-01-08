/*
  Warnings:

  - You are about to drop the column `cityId` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `country_id` on the `Location` table. All the data in the column will be lost.
  - Added the required column `city_id` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_country_id_fkey";

-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "code" TEXT,
ADD COLUMN     "country_code" TEXT;

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "cityId",
DROP COLUMN "country_id",
ADD COLUMN     "city_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
