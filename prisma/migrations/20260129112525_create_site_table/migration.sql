-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "vivalinkSiteId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "countryCode" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);
