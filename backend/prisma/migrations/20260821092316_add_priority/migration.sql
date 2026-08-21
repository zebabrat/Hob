-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable: DEFAULT backfills every existing row to MEDIUM.
ALTER TABLE "Application" ADD COLUMN "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';
