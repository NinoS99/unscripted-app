-- AlterTable
ALTER TABLE "View" ADD COLUMN     "episodeReviewId" INTEGER,
ADD COLUMN     "seasonReviewId" INTEGER,
ADD COLUMN     "showReviewId" INTEGER;

-- CreateTable
CREATE TABLE "ShowReview" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" INTEGER NOT NULL,
    "startedOn" TIMESTAMP(3),
    "endedOn" TIMESTAMP(3),
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonReview" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "startedOn" TIMESTAMP(3),
    "endedOn" TIMESTAMP(3),
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeReview" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "watchedOn" TIMESTAMP(3),
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowReviewTag" (
    "id" SERIAL NOT NULL,
    "showReviewId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ShowReviewTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonReviewTag" (
    "id" SERIAL NOT NULL,
    "seasonReviewId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "SeasonReviewTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeReviewTag" (
    "id" SERIAL NOT NULL,
    "episodeReviewId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "EpisodeReviewTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShowReviewTag_showReviewId_tagId_key" ON "ShowReviewTag"("showReviewId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonReviewTag_seasonReviewId_tagId_key" ON "SeasonReviewTag"("seasonReviewId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeReviewTag_episodeReviewId_tagId_key" ON "EpisodeReviewTag"("episodeReviewId", "tagId");

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_showReviewId_fkey" FOREIGN KEY ("showReviewId") REFERENCES "ShowReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_seasonReviewId_fkey" FOREIGN KEY ("seasonReviewId") REFERENCES "SeasonReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_episodeReviewId_fkey" FOREIGN KEY ("episodeReviewId") REFERENCES "EpisodeReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReview" ADD CONSTRAINT "ShowReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReview" ADD CONSTRAINT "ShowReview_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReview" ADD CONSTRAINT "SeasonReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReview" ADD CONSTRAINT "SeasonReview_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReview" ADD CONSTRAINT "EpisodeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReview" ADD CONSTRAINT "EpisodeReview_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReviewTag" ADD CONSTRAINT "ShowReviewTag_showReviewId_fkey" FOREIGN KEY ("showReviewId") REFERENCES "ShowReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReviewTag" ADD CONSTRAINT "ShowReviewTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReviewTag" ADD CONSTRAINT "SeasonReviewTag_seasonReviewId_fkey" FOREIGN KEY ("seasonReviewId") REFERENCES "SeasonReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReviewTag" ADD CONSTRAINT "SeasonReviewTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReviewTag" ADD CONSTRAINT "EpisodeReviewTag_episodeReviewId_fkey" FOREIGN KEY ("episodeReviewId") REFERENCES "EpisodeReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReviewTag" ADD CONSTRAINT "EpisodeReviewTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
