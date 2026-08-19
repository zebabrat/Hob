-- CreateTable
CREATE TABLE "StatusChange" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusChange_applicationId_changedAt_idx" ON "StatusChange"("applicationId", "changedAt");

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one row per existing application, so avgTimePerStage has a
-- starting point for rows written before this table existed.
--
-- Every application gets a single (fromStatus: NULL, toStatus: <its current
-- status>) row, anchored at "updatedAt" rather than "appliedDate". An
-- application already in, say, INTERVIEW did not jump there instantly from
-- nothing — it passed through APPLIED and possibly SCREENING first — but
-- exactly when is not recorded anywhere, and fabricating intermediate rows
-- would invent a history no one can vouch for. Anchoring on appliedDate
-- instead would claim the current status was reached the day the application
-- was filed, overstating how long the *current* stage has been occupied for
-- anything past APPLIED. updatedAt is the closest honest proxy for "last
-- known to be in this state", short of tracking it from here on, which this
-- migration is what starts doing. The practical effect: avgTimePerStage
-- under-counts time spent in stages before the current one for applications
-- that predate this migration, and it corrects itself as real transitions
-- accumulate going forward.
INSERT INTO "StatusChange" ("applicationId", "fromStatus", "toStatus", "changedAt")
SELECT "id", NULL, "status", "updatedAt"
FROM "Application";
