/*
  Warnings:

  - You are about to drop the column `predictionType` on the `Prediction` table. All the data in the column will be lost.
  - You are about to drop the column `showId` on the `Prediction` table. All the data in the column will be lost.
  - Added the required column `closesAt` to the `Prediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Prediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `predictionText` to the `Prediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `Prediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Prediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Prediction` table without a default value. This is not possible if the table is not empty.
  - Made the column `characterId` on table `Prediction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ShareSide" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "PredictionOutcome" AS ENUM ('YES', 'NO', 'PENDING');

-- CreateEnum
CREATE TYPE "ResultSource" AS ENUM ('AI', 'WIKIPEDIA', 'MANUAL', 'PENDING');

-- CreateEnum
CREATE TYPE "ActivityGroup" AS ENUM ('CONTENT_CREATION', 'ENGAGEMENT', 'PREDICTION_MARKET', 'SOCIAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED', 'COMMENT_CREATED', 'REVIEW_LIKED', 'DISCUSSION_LIKED', 'WATCHLIST_LIKED', 'PREDICTION_LIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'SHARES_PURCHASED', 'SHARES_SOLD', 'PREDICTION_WON', 'PREDICTION_LOST', 'USER_FOLLOWED', 'USER_UNFOLLOWED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('SHOW', 'SEASON', 'EPISODE', 'CHARACTER', 'REVIEW', 'DISCUSSION', 'WATCHLIST', 'PREDICTION', 'COMMENT', 'USER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNED', 'SPENT', 'BONUS', 'PENALTY', 'REFUND');

-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_characterId_fkey";

-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_showId_fkey";

-- DropIndex
DROP INDEX "Prediction_userId_episodeId_predictionType_key";

-- AlterTable
ALTER TABLE "Prediction" DROP COLUMN "predictionType",
DROP COLUMN "showId",
ADD COLUMN     "closesAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "predictionText" TEXT NOT NULL,
ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "characterId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showActivity" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PredictionComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "path" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isPreClose" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionCommentVote" (
    "id" SERIAL NOT NULL,
    "predictionCommentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "value" "VoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionCommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionCommentReaction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionTypeId" INTEGER NOT NULL,
    "predictionCommentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionShare" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" INTEGER NOT NULL,
    "side" "ShareSide" NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionReaction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionTypeId" INTEGER NOT NULL,
    "predictionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionResult" (
    "id" SERIAL NOT NULL,
    "predictionId" INTEGER NOT NULL,
    "outcome" "PredictionOutcome" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" "ResultSource" NOT NULL,
    "evidence" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "entityType" "EntityType",
    "entityId" INTEGER,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPoints" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityPrivacy" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "activityGroup" "ActivityGroup" NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActivityPrivacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityGroupMapping" (
    "id" SERIAL NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "activityGroup" "ActivityGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityGroupMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" INTEGER,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictionComment_predictionId_idx" ON "PredictionComment"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionComment_userId_idx" ON "PredictionComment"("userId");

-- CreateIndex
CREATE INDEX "PredictionComment_parentId_idx" ON "PredictionComment"("parentId");

-- CreateIndex
CREATE INDEX "PredictionComment_depth_idx" ON "PredictionComment"("depth");

-- CreateIndex
CREATE INDEX "PredictionComment_path_idx" ON "PredictionComment"("path");

-- CreateIndex
CREATE INDEX "PredictionComment_predictionId_path_idx" ON "PredictionComment"("predictionId", "path");

-- CreateIndex
CREATE INDEX "PredictionComment_predictionId_createdAt_idx" ON "PredictionComment"("predictionId", "createdAt");

-- CreateIndex
CREATE INDEX "PredictionComment_isPreClose_idx" ON "PredictionComment"("isPreClose");

-- CreateIndex
CREATE INDEX "PredictionCommentVote_predictionCommentId_idx" ON "PredictionCommentVote"("predictionCommentId");

-- CreateIndex
CREATE INDEX "PredictionCommentVote_userId_idx" ON "PredictionCommentVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionCommentVote_predictionCommentId_userId_key" ON "PredictionCommentVote"("predictionCommentId", "userId");

-- CreateIndex
CREATE INDEX "PredictionCommentReaction_userId_idx" ON "PredictionCommentReaction"("userId");

-- CreateIndex
CREATE INDEX "PredictionCommentReaction_reactionTypeId_idx" ON "PredictionCommentReaction"("reactionTypeId");

-- CreateIndex
CREATE INDEX "PredictionCommentReaction_predictionCommentId_idx" ON "PredictionCommentReaction"("predictionCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionCommentReaction_userId_predictionCommentId_key" ON "PredictionCommentReaction"("userId", "predictionCommentId");

-- CreateIndex
CREATE INDEX "PredictionShare_userId_idx" ON "PredictionShare"("userId");

-- CreateIndex
CREATE INDEX "PredictionShare_predictionId_idx" ON "PredictionShare"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionShare_side_idx" ON "PredictionShare"("side");

-- CreateIndex
CREATE INDEX "PredictionReaction_userId_idx" ON "PredictionReaction"("userId");

-- CreateIndex
CREATE INDEX "PredictionReaction_reactionTypeId_idx" ON "PredictionReaction"("reactionTypeId");

-- CreateIndex
CREATE INDEX "PredictionReaction_predictionId_idx" ON "PredictionReaction"("predictionId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionReaction_userId_predictionId_key" ON "PredictionReaction"("userId", "predictionId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionResult_predictionId_key" ON "PredictionResult"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionResult_outcome_idx" ON "PredictionResult"("outcome");

-- CreateIndex
CREATE INDEX "PredictionResult_source_idx" ON "PredictionResult"("source");

-- CreateIndex
CREATE INDEX "PredictionResult_resolvedAt_idx" ON "PredictionResult"("resolvedAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_activityType_idx" ON "UserActivity"("activityType");

-- CreateIndex
CREATE INDEX "UserActivity_entityType_idx" ON "UserActivity"("entityType");

-- CreateIndex
CREATE INDEX "UserActivity_isPublic_idx" ON "UserActivity"("isPublic");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_isPublic_createdAt_idx" ON "UserActivity"("userId", "isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_isPublic_activityType_idx" ON "UserActivity"("userId", "isPublic", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "UserPoints_userId_key" ON "UserPoints"("userId");

-- CreateIndex
CREATE INDEX "UserPoints_balance_idx" ON "UserPoints"("balance");

-- CreateIndex
CREATE INDEX "UserPoints_lastUpdated_idx" ON "UserPoints"("lastUpdated");

-- CreateIndex
CREATE INDEX "UserActivityPrivacy_userId_idx" ON "UserActivityPrivacy"("userId");

-- CreateIndex
CREATE INDEX "UserActivityPrivacy_activityGroup_idx" ON "UserActivityPrivacy"("activityGroup");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivityPrivacy_userId_activityGroup_key" ON "UserActivityPrivacy"("userId", "activityGroup");

-- CreateIndex
CREATE INDEX "ActivityGroupMapping_activityGroup_idx" ON "ActivityGroupMapping"("activityGroup");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityGroupMapping_activityType_key" ON "ActivityGroupMapping"("activityType");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_idx" ON "PointsTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_type_idx" ON "PointsTransaction"("type");

-- CreateIndex
CREATE INDEX "PointsTransaction_createdAt_idx" ON "PointsTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_createdAt_idx" ON "PointsTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- CreateIndex
CREATE INDEX "Prediction_episodeId_idx" ON "Prediction"("episodeId");

-- CreateIndex
CREATE INDEX "Prediction_characterId_idx" ON "Prediction"("characterId");

-- CreateIndex
CREATE INDEX "Prediction_templateId_idx" ON "Prediction"("templateId");

-- CreateIndex
CREATE INDEX "Prediction_closesAt_idx" ON "Prediction"("closesAt");

-- CreateIndex
CREATE INDEX "Prediction_isActive_idx" ON "Prediction"("isActive");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PredictionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionComment" ADD CONSTRAINT "PredictionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionComment" ADD CONSTRAINT "PredictionComment_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionComment" ADD CONSTRAINT "PredictionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PredictionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionCommentVote" ADD CONSTRAINT "PredictionCommentVote_predictionCommentId_fkey" FOREIGN KEY ("predictionCommentId") REFERENCES "PredictionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionCommentVote" ADD CONSTRAINT "PredictionCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionCommentReaction" ADD CONSTRAINT "PredictionCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionCommentReaction" ADD CONSTRAINT "PredictionCommentReaction_reactionTypeId_fkey" FOREIGN KEY ("reactionTypeId") REFERENCES "ReactionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionCommentReaction" ADD CONSTRAINT "PredictionCommentReaction_predictionCommentId_fkey" FOREIGN KEY ("predictionCommentId") REFERENCES "PredictionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionShare" ADD CONSTRAINT "PredictionShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionShare" ADD CONSTRAINT "PredictionShare_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionReaction" ADD CONSTRAINT "PredictionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionReaction" ADD CONSTRAINT "PredictionReaction_reactionTypeId_fkey" FOREIGN KEY ("reactionTypeId") REFERENCES "ReactionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionReaction" ADD CONSTRAINT "PredictionReaction_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionResult" ADD CONSTRAINT "PredictionResult_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_activityType_fkey" FOREIGN KEY ("activityType") REFERENCES "ActivityGroupMapping"("activityType") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPoints" ADD CONSTRAINT "UserPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityPrivacy" ADD CONSTRAINT "UserActivityPrivacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
