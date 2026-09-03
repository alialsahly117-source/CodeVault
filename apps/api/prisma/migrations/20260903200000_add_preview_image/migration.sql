-- Add optional preview image URL to codes and prompts
ALTER TABLE "codes" ADD COLUMN "previewImageUrl" TEXT;
ALTER TABLE "prompts" ADD COLUMN "previewImageUrl" TEXT;
