-- DropForeignKey
ALTER TABLE "WatchListComment" DROP CONSTRAINT "WatchListComment_watchListId_fkey";

-- DropForeignKey
ALTER TABLE "WatchListShow" DROP CONSTRAINT "WatchListShow_watchListId_fkey";

-- DropForeignKey
ALTER TABLE "WatchListTag" DROP CONSTRAINT "WatchListTag_watchListId_fkey";

-- AddForeignKey
ALTER TABLE "WatchListShow" ADD CONSTRAINT "WatchListShow_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListTag" ADD CONSTRAINT "WatchListTag_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListComment" ADD CONSTRAINT "WatchListComment_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
