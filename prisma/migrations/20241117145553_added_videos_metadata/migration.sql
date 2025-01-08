-- CreateTable
CREATE TABLE "VideosMetaData" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "thumbnail" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideosMetaData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VideosMetaData" ADD CONSTRAINT "VideosMetaData_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
