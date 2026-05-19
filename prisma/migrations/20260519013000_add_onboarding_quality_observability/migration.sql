CREATE TYPE "ReadingDepth" AS ENUM ('QUICK', 'BALANCED', 'DEEP');
CREATE TYPE "ArticleFeedbackReason" AS ENUM ('SHOW_FEWER', 'SENSITIVE', 'LOW_QUALITY');

CREATE TABLE "UserFeedPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sources" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "location" TEXT NOT NULL DEFAULT 'us',
  "readingDepth" "ReadingDepth" NOT NULL DEFAULT 'BALANCED',
  "hideNsfw" BOOLEAN NOT NULL DEFAULT true,
  "politicalSensitivity" TEXT NOT NULL DEFAULT 'balanced',
  "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserFeedPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArticleFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "reason" "ArticleFeedbackReason" NOT NULL DEFAULT 'SHOW_FEWER',
  "source" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ArticleFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "path" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserFeedPreference_userId_key" ON "UserFeedPreference"("userId");
CREATE UNIQUE INDEX "ArticleFeedback_userId_articleId_reason_key" ON "ArticleFeedback"("userId", "articleId", "reason");
CREATE INDEX "ArticleFeedback_userId_source_idx" ON "ArticleFeedback"("userId", "source");
CREATE INDEX "ArticleFeedback_userId_category_idx" ON "ArticleFeedback"("userId", "category");
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

ALTER TABLE "UserFeedPreference"
ADD CONSTRAINT "UserFeedPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleFeedback"
ADD CONSTRAINT "ArticleFeedback_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleFeedback"
ADD CONSTRAINT "ArticleFeedback_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
