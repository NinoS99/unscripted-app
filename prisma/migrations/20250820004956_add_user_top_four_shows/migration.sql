-- CreateTable
CREATE TABLE "UserTopFourShow" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTopFourShow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTopFourShow_userId_position_idx" ON "UserTopFourShow"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopFourShow_userId_showId_key" ON "UserTopFourShow"("userId", "showId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopFourShow_userId_position_key" ON "UserTopFourShow"("userId", "position");

-- AddForeignKey
ALTER TABLE "UserTopFourShow" ADD CONSTRAINT "UserTopFourShow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopFourShow" ADD CONSTRAINT "UserTopFourShow_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
