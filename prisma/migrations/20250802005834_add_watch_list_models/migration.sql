/*
  Warnings:

  - A unique constraint covering the columns `[userId,watchListId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "watchListId" INTEGER;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "watchListId" INTEGER;

-- CreateTable
CREATE TABLE "WatchList" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchListShow" (
    "id" SERIAL NOT NULL,
    "watchListId" INTEGER NOT NULL,
    "showId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchListShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchListTag" (
    "id" SERIAL NOT NULL,
    "watchListId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "WatchListTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchListComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchListId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchListComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchList_userId_idx" ON "WatchList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchListShow_watchListId_showId_key" ON "WatchListShow"("watchListId", "showId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchListTag_watchListId_tagId_key" ON "WatchListTag"("watchListId", "tagId");

-- CreateIndex
CREATE INDEX "WatchListComment_watchListId_idx" ON "WatchListComment"("watchListId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_watchListId_key" ON "Like"("userId", "watchListId");

-- CreateIndex
CREATE INDEX "View_watchListId_idx" ON "View"("watchListId");

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchList" ADD CONSTRAINT "WatchList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListShow" ADD CONSTRAINT "WatchListShow_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListShow" ADD CONSTRAINT "WatchListShow_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListTag" ADD CONSTRAINT "WatchListTag_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListTag" ADD CONSTRAINT "WatchListTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListComment" ADD CONSTRAINT "WatchListComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListComment" ADD CONSTRAINT "WatchListComment_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
