-- CreateTable
CREATE TABLE "PredictionTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "showTypes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PredictionTemplate_name_key" ON "PredictionTemplate"("name");

-- CreateIndex
CREATE INDEX "PredictionTemplate_showTypes_idx" ON "PredictionTemplate"("showTypes");

-- CreateIndex
CREATE INDEX "PredictionTemplate_isActive_idx" ON "PredictionTemplate"("isActive");
