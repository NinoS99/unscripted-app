/*
  Warnings:

  - You are about to drop the `_NetworkToShow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_NetworkToShow" DROP CONSTRAINT "_NetworkToShow_A_fkey";

-- DropForeignKey
ALTER TABLE "_NetworkToShow" DROP CONSTRAINT "_NetworkToShow_B_fkey";

-- DropTable
DROP TABLE "_NetworkToShow";

-- CreateTable
CREATE TABLE "ShowsOnNetworks" (
    "showId" INTEGER NOT NULL,
    "networkId" INTEGER NOT NULL,

    CONSTRAINT "ShowsOnNetworks_pkey" PRIMARY KEY ("showId","networkId")
);

-- AddForeignKey
ALTER TABLE "ShowsOnNetworks" ADD CONSTRAINT "ShowsOnNetworks_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowsOnNetworks" ADD CONSTRAINT "ShowsOnNetworks_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
