/*
  Warnings:

  - Added the required column `path` to the `DiscussionComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscussionComment" ADD COLUMN     "path" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "DiscussionComment_path_idx" ON "DiscussionComment"("path");

-- CreateIndex
CREATE INDEX "DiscussionComment_discussionId_path_idx" ON "DiscussionComment"("discussionId", "path");

-- CreateIndex
CREATE INDEX "DiscussionComment_discussionId_createdAt_idx" ON "DiscussionComment"("discussionId", "createdAt");
