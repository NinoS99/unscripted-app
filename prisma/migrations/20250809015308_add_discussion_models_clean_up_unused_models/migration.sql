/*
  Warnings:

  - You are about to drop the column `commentId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the column `reviewId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommentVote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EpisodeReviewCharacter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EpisodeTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SeasonTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShowTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `View` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,discussionId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VoteValue" AS ENUM ('-1', '1');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_characterId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_showId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_userId_fkey";

-- DropForeignKey
ALTER TABLE "EpisodeReviewCharacter" DROP CONSTRAINT "EpisodeReviewCharacter_characterId_fkey";

-- DropForeignKey
ALTER TABLE "EpisodeReviewCharacter" DROP CONSTRAINT "EpisodeReviewCharacter_episodeReviewId_fkey";

-- DropForeignKey
ALTER TABLE "EpisodeTag" DROP CONSTRAINT "EpisodeTag_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "EpisodeTag" DROP CONSTRAINT "EpisodeTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_showId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonTag" DROP CONSTRAINT "SeasonTag_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonTag" DROP CONSTRAINT "SeasonTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "ShowTag" DROP CONSTRAINT "ShowTag_showId_fkey";

-- DropForeignKey
ALTER TABLE "ShowTag" DROP CONSTRAINT "ShowTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_characterId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_episodeReviewId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_seasonReviewId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_showId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_showReviewId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_userId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_watchListId_fkey";

-- DropIndex
DROP INDEX "Like_userId_commentId_key";

-- DropIndex
DROP INDEX "Like_userId_reviewId_key";

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "commentId",
DROP COLUMN "reviewId",
ADD COLUMN     "discussionId" INTEGER;

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "CommentVote";

-- DropTable
DROP TABLE "EpisodeReviewCharacter";

-- DropTable
DROP TABLE "EpisodeTag";

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "SeasonTag";

-- DropTable
DROP TABLE "ShowTag";

-- DropTable
DROP TABLE "View";

-- CreateTable
CREATE TABLE "Discussion" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discussionId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionCommentVote" (
    "id" SERIAL NOT NULL,
    "discussionCommentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "value" "VoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionCommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionTag" (
    "id" SERIAL NOT NULL,
    "discussionId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "discussionCommentId" INTEGER,
    "episodeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "discussionId" INTEGER NOT NULL,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "pollId" INTEGER NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "pollOptionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Discussion_userId_idx" ON "Discussion"("userId");

-- CreateIndex
CREATE INDEX "Discussion_showId_idx" ON "Discussion"("showId");

-- CreateIndex
CREATE INDEX "Discussion_seasonId_idx" ON "Discussion"("seasonId");

-- CreateIndex
CREATE INDEX "Discussion_episodeId_idx" ON "Discussion"("episodeId");

-- CreateIndex
CREATE INDEX "Discussion_createdAt_idx" ON "Discussion"("createdAt");

-- CreateIndex
CREATE INDEX "DiscussionComment_discussionId_idx" ON "DiscussionComment"("discussionId");

-- CreateIndex
CREATE INDEX "DiscussionComment_userId_idx" ON "DiscussionComment"("userId");

-- CreateIndex
CREATE INDEX "DiscussionComment_parentId_idx" ON "DiscussionComment"("parentId");

-- CreateIndex
CREATE INDEX "DiscussionComment_depth_idx" ON "DiscussionComment"("depth");

-- CreateIndex
CREATE INDEX "DiscussionCommentVote_discussionCommentId_idx" ON "DiscussionCommentVote"("discussionCommentId");

-- CreateIndex
CREATE INDEX "DiscussionCommentVote_userId_idx" ON "DiscussionCommentVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionCommentVote_discussionCommentId_userId_key" ON "DiscussionCommentVote"("discussionCommentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionTag_discussionId_tagId_key" ON "DiscussionTag"("discussionId", "tagId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE INDEX "Reaction_discussionCommentId_idx" ON "Reaction"("discussionCommentId");

-- CreateIndex
CREATE INDEX "Reaction_episodeId_idx" ON "Reaction"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_discussionCommentId_key" ON "Reaction"("userId", "discussionCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_episodeId_key" ON "Reaction"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "Poll_discussionId_idx" ON "Poll"("discussionId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");

-- CreateIndex
CREATE INDEX "PollVote_userId_idx" ON "PollVote"("userId");

-- CreateIndex
CREATE INDEX "PollVote_pollOptionId_idx" ON "PollVote"("pollOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_userId_pollOptionId_key" ON "PollVote"("userId", "pollOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_discussionId_key" ON "Like"("userId", "discussionId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionComment" ADD CONSTRAINT "DiscussionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionComment" ADD CONSTRAINT "DiscussionComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionComment" ADD CONSTRAINT "DiscussionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DiscussionComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionCommentVote" ADD CONSTRAINT "DiscussionCommentVote_discussionCommentId_fkey" FOREIGN KEY ("discussionCommentId") REFERENCES "DiscussionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionCommentVote" ADD CONSTRAINT "DiscussionCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionTag" ADD CONSTRAINT "DiscussionTag_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionTag" ADD CONSTRAINT "DiscussionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_discussionCommentId_fkey" FOREIGN KEY ("discussionCommentId") REFERENCES "DiscussionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
