-- Session tokens are now stored as a SHA-256 hash: a database leak must not
-- hand over live sessions. Existing rows hold raw tokens in the old format and
-- cannot be converted, so they are dropped — everyone signs in again.
DELETE FROM "Session";

ALTER TABLE "Session" DROP COLUMN "token";
ALTER TABLE "Session" ADD COLUMN "tokenHash" TEXT NOT NULL;

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- Supports the periodic delete of expired sessions.
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
