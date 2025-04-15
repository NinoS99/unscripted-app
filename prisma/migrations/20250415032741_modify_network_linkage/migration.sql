/*
  Warnings:

  - You are about to drop the `_ShowsOnNetworks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ShowsOnNetworks" DROP CONSTRAINT "_ShowsOnNetworks_A_fkey";

-- DropForeignKey
ALTER TABLE "_ShowsOnNetworks" DROP CONSTRAINT "_ShowsOnNetworks_B_fkey";

-- DropTable
DROP TABLE "_ShowsOnNetworks";

-- CreateTable
CREATE TABLE "_NetworkToShow" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NetworkToShow_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NetworkToShow_B_index" ON "_NetworkToShow"("B");

-- AddForeignKey
ALTER TABLE "_NetworkToShow" ADD CONSTRAINT "_NetworkToShow_A_fkey" FOREIGN KEY ("A") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NetworkToShow" ADD CONSTRAINT "_NetworkToShow_B_fkey" FOREIGN KEY ("B") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
