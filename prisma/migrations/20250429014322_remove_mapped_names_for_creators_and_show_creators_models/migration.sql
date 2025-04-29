-- AlterTable
ALTER TABLE "Creator" RENAME CONSTRAINT "creators_pkey" TO "Creator_pkey";

-- AlterTable
ALTER TABLE "ShowCreator" RENAME CONSTRAINT "shows_creators_pkey" TO "ShowCreator_pkey";
