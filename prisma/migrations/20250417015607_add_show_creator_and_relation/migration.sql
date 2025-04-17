-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "profilePath" TEXT;

-- CreateTable
CREATE TABLE "creators" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "profile_path" TEXT,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shows_creators" (
    "showId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "shows_creators_pkey" PRIMARY KEY ("showId","creatorId")
);

-- AddForeignKey
ALTER TABLE "shows_creators" ADD CONSTRAINT "shows_creators_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows_creators" ADD CONSTRAINT "shows_creators_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
