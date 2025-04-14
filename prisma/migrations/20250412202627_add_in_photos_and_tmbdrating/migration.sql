/*
  Warnings:

  - You are about to drop the column `voteAverage` on the `Show` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "tmdbRating" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "tmdbRating" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Show" DROP COLUMN "voteAverage",
ADD COLUMN     "tmdbRating" DOUBLE PRECISION;
