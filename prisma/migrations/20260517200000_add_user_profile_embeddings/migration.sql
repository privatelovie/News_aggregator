-- CreateTable
CREATE TABLE "UserProfileEmbedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" TEXT NOT NULL,
    "sourceArticleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfileEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileEmbedding_userId_key" ON "UserProfileEmbedding"("userId");

-- AddForeignKey
ALTER TABLE "UserProfileEmbedding" ADD CONSTRAINT "UserProfileEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
