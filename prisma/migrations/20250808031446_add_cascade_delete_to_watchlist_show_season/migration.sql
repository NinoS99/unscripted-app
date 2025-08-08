-- DropForeignKey
ALTER TABLE "WatchListShowSeason" DROP CONSTRAINT "WatchListShowSeason_watchListShowId_fkey";

-- AddForeignKey
ALTER TABLE "WatchListShowSeason" ADD CONSTRAINT "WatchListShowSeason_watchListShowId_fkey" FOREIGN KEY ("watchListShowId") REFERENCES "WatchListShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
