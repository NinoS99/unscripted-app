/*
  Warnings:

  - You are about to drop the column `reactionType` on the `Reaction` table. All the data in the column will be lost.
  - Added the required column `reactionTypeId` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "reactionType",
ADD COLUMN     "reactionTypeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ReactionType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReactionType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReactionType_name_key" ON "ReactionType"("name");

-- CreateIndex
CREATE INDEX "ReactionType_name_idx" ON "ReactionType"("name");

-- CreateIndex
CREATE INDEX "ReactionType_category_idx" ON "ReactionType"("category");

-- CreateIndex
CREATE INDEX "Reaction_reactionTypeId_idx" ON "Reaction"("reactionTypeId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_reactionTypeId_fkey" FOREIGN KEY ("reactionTypeId") REFERENCES "ReactionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
