/*
  Warnings:

  - You are about to drop the column `networks` on the `Show` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Show" DROP COLUMN "networks";

-- CreateTable
CREATE TABLE "Network" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logoPath" TEXT,
    "originCountry" TEXT,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ShowsOnNetworks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ShowsOnNetworks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ShowsOnNetworks_B_index" ON "_ShowsOnNetworks"("B");

-- AddForeignKey
ALTER TABLE "_ShowsOnNetworks" ADD CONSTRAINT "_ShowsOnNetworks_A_fkey" FOREIGN KEY ("A") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ShowsOnNetworks" ADD CONSTRAINT "_ShowsOnNetworks_B_fkey" FOREIGN KEY ("B") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
