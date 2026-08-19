import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { updateApplication } from '../api/updateApplication'

/**
 * Moves a card to another column.
 *
 * The card lands in its new column before the request goes out, because a drag
 * that visibly snaps back while the network thinks about it feels broken. If
 * the request then fails, the card returns to where it was and the reason is
 * shown — the board never keeps a position the server did not accept.
 */
export function useUpdateApplicationStatus(
  applications: ApplicationDto[],
  setApplications: Dispatch<SetStateAction<ApplicationDto[]>>,
) {
  const [error, setError] = useState<string | null>(null)

  const move = useCallback(
    async (id: number, status: ApplicationStatus) => {
      const previous = applications.find((application) => application.id === id)
      // Dropping a card back where it came from is not a change.
      if (!previous || previous.status === status) return

      setError(null)
      setApplications((current) =>
        current.map((application) =>
          application.id === id
            ? // The new timestamp is what puts the card at the top of its
              // column, matching where the server will place it.
              { ...application, status, updatedAt: new Date().toISOString() }
            : application,
        ),
      )

      try {
        const updated = await updateApplication(id, { status })
        // The server's own row replaces the guess, so updatedAt is the real one.
        setApplications((current) =>
          current.map((application) => (application.id === id ? updated : application)),
        )
      } catch (err) {
        setError(toFormErrorMessage(err))
        setApplications((current) =>
          current.map((application) => (application.id === id ? previous : application)),
        )
      }
    },
    [applications, setApplications],
  )

  return { move, error }
}
