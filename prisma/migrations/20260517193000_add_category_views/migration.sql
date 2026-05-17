-- CreateTable
CREATE TABLE "UserCategoryView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCategoryView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCategoryView_userId_categoryId_key" ON "UserCategoryView"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "UserCategoryView_categoryId_idx" ON "UserCategoryView"("categoryId");

-- CreateIndex
CREATE INDEX "UserCategoryView_userId_updatedAt_idx" ON "UserCategoryView"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "UserCategoryView" ADD CONSTRAINT "UserCategoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCategoryView" ADD CONSTRAINT "UserCategoryView_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
