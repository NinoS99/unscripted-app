-- AlterTable
ALTER TABLE "WatchList" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "WatchListShow" ADD COLUMN     "ranking" INTEGER;

-- CreateIndex
CREATE INDEX "WatchList_isPublic_idx" ON "WatchList"("isPublic");

-- CreateIndex
CREATE INDEX "WatchListShow_watchListId_ranking_idx" ON "WatchListShow"("watchListId", "ranking");
