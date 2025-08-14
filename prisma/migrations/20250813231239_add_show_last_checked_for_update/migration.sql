-- CreateTable
CREATE TABLE "ShowLastCheckedForUpdate" (
    "id" SERIAL NOT NULL,
    "showId" INTEGER NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowLastCheckedForUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShowLastCheckedForUpdate_showId_key" ON "ShowLastCheckedForUpdate"("showId");

-- AddForeignKey
ALTER TABLE "ShowLastCheckedForUpdate" ADD CONSTRAINT "ShowLastCheckedForUpdate_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
