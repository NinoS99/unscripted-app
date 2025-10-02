-- AlterTable
ALTER TABLE "UserActivity" ADD COLUMN     "giverId" TEXT;

-- CreateIndex
CREATE INDEX "UserActivity_giverId_idx" ON "UserActivity"("giverId");

-- CreateIndex
CREATE INDEX "UserActivity_giverId_createdAt_idx" ON "UserActivity"("giverId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
