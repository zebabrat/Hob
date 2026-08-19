import type { ApplicationStatus, Prisma } from '../generated/prisma/client.js';

/**
 * A transaction client — the interactive-transaction parameter Prisma hands
 * to a `$transaction(async (tx) => ...)` callback. Both writers below take one
 * rather than the top-level `prisma` client, so the audit row can never commit
 * without the state change it describes, or vice versa.
 */
type TransactionClient = Prisma.TransactionClient;

/** Written once, right after the row that creates it — there is no "from" status yet. */
export function recordInitialStatus(
  tx: TransactionClient,
  applicationId: number,
  status: ApplicationStatus,
): Promise<unknown> {
  return tx.statusChange.create({
    data: { applicationId, fromStatus: null, toStatus: status },
  });
}

/** Written when a PATCH actually changes status — callers check that first. */
export function recordStatusChange(
  tx: TransactionClient,
  applicationId: number,
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus,
): Promise<unknown> {
  return tx.statusChange.create({
    data: { applicationId, fromStatus, toStatus },
  });
}
