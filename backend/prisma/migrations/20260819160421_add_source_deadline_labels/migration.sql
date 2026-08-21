-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "offerDeadline" TIMESTAMP(3),
ADD COLUMN     "source" TEXT;
