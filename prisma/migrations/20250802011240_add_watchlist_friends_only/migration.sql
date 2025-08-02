-- AlterTable
ALTER TABLE "WatchList" ADD COLUMN     "friendsOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "WatchList_friendsOnly_idx" ON "WatchList"("friendsOnly");
