-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('GROSS', 'NET');

-- AlterTable: salaryType is purely additive.
ALTER TABLE "Application" ADD COLUMN "salaryType" "SalaryType";

-- AlterTable: source moves from a single string to a text array. Hand-written
-- rather than left to Prisma's own diff, which wants to drop and recreate the
-- column outright (data loss) — every existing single value is preserved as
-- a one-element array instead.
ALTER TABLE "Application" ADD COLUMN "source_new" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "Application" SET "source_new" = ARRAY["source"] WHERE "source" IS NOT NULL;
ALTER TABLE "Application" DROP COLUMN "source";
ALTER TABLE "Application" RENAME COLUMN "source_new" TO "source";
