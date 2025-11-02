-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('CREATE', 'EDIT', 'DELETE');

-- CreateEnum
CREATE TYPE "HistoryTarget" AS ENUM ('NOTE', 'DATABASE', 'SCHEDULE');

-- CreateTable
CREATE TABLE "history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "action" "HistoryAction" NOT NULL,
    "target" "HistoryTarget" NOT NULL,
    "targetName" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "history_createdAt_idx" ON "history"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
