/*
  Warnings:

  - You are about to drop the column `name` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `profilePath` on the `Character` table. All the data in the column will be lost.
  - Added the required column `personId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "name",
DROP COLUMN "profilePath",
ADD COLUMN     "personId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "characterId" INTEGER;

-- CreateTable
CREATE TABLE "Person" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "profilePath" TEXT,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
