-- Add durable source controls and richer bookmark organization.
CREATE TYPE "SourcePreferenceAction" AS ENUM ('NEUTRAL', 'MUTE', 'PRIORITIZE');

ALTER TABLE "Bookmark"
ADD COLUMN "folder" TEXT NOT NULL DEFAULT 'Read later',
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "note" TEXT,
ADD COLUMN "offlineSnapshot" TEXT,
ADD COLUMN "offlineSavedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Bookmark_userId_folder_idx" ON "Bookmark"("userId", "folder");

CREATE TABLE "SourcePreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "action" "SourcePreferenceAction" NOT NULL DEFAULT 'NEUTRAL',
  "hideSensational" BOOLEAN NOT NULL DEFAULT false,
  "preferredRegion" TEXT,
  "preferredLanguage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SourcePreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SourcePreference_userId_source_key" ON "SourcePreference"("userId", "source");
CREATE INDEX "SourcePreference_userId_action_idx" ON "SourcePreference"("userId", "action");

ALTER TABLE "SourcePreference"
ADD CONSTRAINT "SourcePreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
