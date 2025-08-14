-- CreateTable
CREATE TABLE "UpdateShowsLog" (
    "id" SERIAL NOT NULL,
    "showId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateShowsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpdateShowsLog_showId_createdAt_idx" ON "UpdateShowsLog"("showId", "createdAt");

-- CreateIndex
CREATE INDEX "UpdateShowsLog_entityType_action_idx" ON "UpdateShowsLog"("entityType", "action");

-- AddForeignKey
ALTER TABLE "UpdateShowsLog" ADD CONSTRAINT "UpdateShowsLog_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
