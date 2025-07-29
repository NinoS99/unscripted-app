-- CreateTable
CREATE TABLE "ShowReviewCharacter" (
    "id" SERIAL NOT NULL,
    "showReviewId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,

    CONSTRAINT "ShowReviewCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonReviewCharacter" (
    "id" SERIAL NOT NULL,
    "seasonReviewId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,

    CONSTRAINT "SeasonReviewCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeReviewCharacter" (
    "id" SERIAL NOT NULL,
    "episodeReviewId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,

    CONSTRAINT "EpisodeReviewCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShowReviewCharacter_showReviewId_characterId_key" ON "ShowReviewCharacter"("showReviewId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonReviewCharacter_seasonReviewId_characterId_key" ON "SeasonReviewCharacter"("seasonReviewId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeReviewCharacter_episodeReviewId_characterId_key" ON "EpisodeReviewCharacter"("episodeReviewId", "characterId");

-- AddForeignKey
ALTER TABLE "ShowReviewCharacter" ADD CONSTRAINT "ShowReviewCharacter_showReviewId_fkey" FOREIGN KEY ("showReviewId") REFERENCES "ShowReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReviewCharacter" ADD CONSTRAINT "ShowReviewCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReviewCharacter" ADD CONSTRAINT "SeasonReviewCharacter_seasonReviewId_fkey" FOREIGN KEY ("seasonReviewId") REFERENCES "SeasonReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReviewCharacter" ADD CONSTRAINT "SeasonReviewCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReviewCharacter" ADD CONSTRAINT "EpisodeReviewCharacter_episodeReviewId_fkey" FOREIGN KEY ("episodeReviewId") REFERENCES "EpisodeReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReviewCharacter" ADD CONSTRAINT "EpisodeReviewCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
