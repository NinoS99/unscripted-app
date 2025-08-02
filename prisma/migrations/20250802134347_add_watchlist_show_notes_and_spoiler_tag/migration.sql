-- AlterTable
ALTER TABLE "WatchListShow" ADD COLUMN     "note" TEXT,
ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WatchListShowSeason" (
    "id" SERIAL NOT NULL,
    "watchListShowId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,

    CONSTRAINT "WatchListShowSeason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchListShowSeason_watchListShowId_seasonId_key" ON "WatchListShowSeason"("watchListShowId", "seasonId");

-- AddForeignKey
ALTER TABLE "WatchListShowSeason" ADD CONSTRAINT "WatchListShowSeason_watchListShowId_fkey" FOREIGN KEY ("watchListShowId") REFERENCES "WatchListShow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListShowSeason" ADD CONSTRAINT "WatchListShowSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
