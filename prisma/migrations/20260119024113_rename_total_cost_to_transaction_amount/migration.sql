/*
  Warnings:

  - You are about to drop the column `totalCost` on the `PredictionShare` table. All the data in the column will be lost.
  - Added the required column `transactionAmount` to the `PredictionShare` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `PredictionShare` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShareTransactionType" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "PredictionShare" DROP COLUMN "totalCost",
ADD COLUMN     "transactionAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" "ShareTransactionType" NOT NULL;

-- CreateIndex
CREATE INDEX "PredictionShare_type_idx" ON "PredictionShare"("type");

-- CreateIndex
CREATE INDEX "PredictionShare_userId_predictionId_side_idx" ON "PredictionShare"("userId", "predictionId", "side");
