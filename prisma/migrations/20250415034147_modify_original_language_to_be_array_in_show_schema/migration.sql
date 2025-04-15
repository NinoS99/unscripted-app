/*
  Warnings:

  - The `originalLanguage` column on the `Show` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Show" DROP COLUMN "originalLanguage",
ADD COLUMN     "originalLanguage" TEXT[];
