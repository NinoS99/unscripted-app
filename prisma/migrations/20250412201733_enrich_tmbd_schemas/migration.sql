-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "stillPath" TEXT;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "posterPath" TEXT;

-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "backdropPath" TEXT,
ADD COLUMN     "isRunning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "networks" TEXT[],
ADD COLUMN     "posterPath" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "voteAverage" DOUBLE PRECISION;
