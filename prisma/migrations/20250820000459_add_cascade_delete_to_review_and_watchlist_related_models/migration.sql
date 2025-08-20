-- DropForeignKey
ALTER TABLE "EpisodeReviewTag" DROP CONSTRAINT "EpisodeReviewTag_episodeReviewId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_episodeReviewId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_predictionId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_seasonReviewId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_showReviewId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_watchListId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonReviewCharacter" DROP CONSTRAINT "SeasonReviewCharacter_seasonReviewId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonReviewTag" DROP CONSTRAINT "SeasonReviewTag_seasonReviewId_fkey";

-- DropForeignKey
ALTER TABLE "ShowReviewCharacter" DROP CONSTRAINT "ShowReviewCharacter_showReviewId_fkey";

-- DropForeignKey
ALTER TABLE "ShowReviewTag" DROP CONSTRAINT "ShowReviewTag_showReviewId_fkey";

-- AddForeignKey
ALTER TABLE "ShowReviewCharacter" ADD CONSTRAINT "ShowReviewCharacter_showReviewId_fkey" FOREIGN KEY ("showReviewId") REFERENCES "ShowReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReviewCharacter" ADD CONSTRAINT "SeasonReviewCharacter_seasonReviewId_fkey" FOREIGN KEY ("seasonReviewId") REFERENCES "SeasonReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReviewTag" ADD CONSTRAINT "ShowReviewTag_showReviewId_fkey" FOREIGN KEY ("showReviewId") REFERENCES "ShowReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReviewTag" ADD CONSTRAINT "SeasonReviewTag_seasonReviewId_fkey" FOREIGN KEY ("seasonReviewId") REFERENCES "SeasonReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeReviewTag" ADD CONSTRAINT "EpisodeReviewTag_episodeReviewId_fkey" FOREIGN KEY ("episodeReviewId") REFERENCES "EpisodeReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_episodeReviewId_fkey" FOREIGN KEY ("episodeReviewId") REFERENCES "EpisodeReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_seasonReviewId_fkey" FOREIGN KEY ("seasonReviewId") REFERENCES "SeasonReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_showReviewId_fkey" FOREIGN KEY ("showReviewId") REFERENCES "ShowReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "WatchList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
