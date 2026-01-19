/*
  Warnings:

  - Added the required column `closesAt` to the `PredictionResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_templateId_fkey";

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "manualCharacterName" TEXT,
ALTER COLUMN "characterId" DROP NOT NULL,
ALTER COLUMN "templateId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PredictionResult" ADD COLUMN     "closesAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "PredictionResult_closesAt_idx" ON "PredictionResult"("closesAt");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PredictionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
