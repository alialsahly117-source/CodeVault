-- CreateTable
CREATE TABLE "prompt_translations" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_translations_promptId_language_key" ON "prompt_translations"("promptId", "language");

-- AddForeignKey
ALTER TABLE "prompt_translations" ADD CONSTRAINT "prompt_translations_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
