-- CreateTable
CREATE TABLE "ArticleSummaryCache" (
    "id" TEXT NOT NULL,
    "articleHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "model" TEXT NOT NULL,
    "threeLineSummary" TEXT[],
    "explainSimply" TEXT NOT NULL,
    "keyTakeaways" TEXT[],
    "whyThisMatters" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleSummaryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleSummaryCache_articleHash_key" ON "ArticleSummaryCache"("articleHash");

-- CreateIndex
CREATE INDEX "ArticleSummaryCache_expiresAt_idx" ON "ArticleSummaryCache"("expiresAt");
