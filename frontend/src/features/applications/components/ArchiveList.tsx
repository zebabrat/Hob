import { Link } from 'react-router'
import { formatShortDate } from 'shared/helpers/formatShortDate'
import { FormError } from 'shared/components/FormError'
import { ARCHIVE_COLUMNS, groupByStatus } from '../helpers/groupByStatus'
import { useApplications } from '../hooks/useApplications'
import { ArchiveSkeleton } from './ArchiveSkeleton'

/**
 * Rejected and Withdrawn, off the board and listed here instead — per the
 * design backlog's "Отклонённые уходят в архив автоматически". A flat list
 * per status rather than a second kanban: nothing here moves between columns
 * again, so the drag affordance the board needs would be dead weight.
 */
export function ArchiveList() {
  const { applications, isLoading, error } = useApplications()
  const columns = groupByStatus(applications, ARCHIVE_COLUMNS)
  const total = columns.reduce((sum, column) => sum + column.applications.length, 0)

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-5xl tracking-[-0.04em] text-foreground">Archive</h1>
        <p className="mt-3 font-mono text-[0.625rem] tracking-[0.09em] text-text-tertiary uppercase">
          {total} {total === 1 ? 'application' : 'applications'}
        </p>
      </header>

      <FormError message={error} />

      {isLoading ? (
        <ArchiveSkeleton />
      ) : total === 0 ? (
        <p className="border-t border-border py-16 text-center font-mono text-xs tracking-[0.08em] text-text-tertiary uppercase">
          Nothing archived yet
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {columns.map(
            (column) =>
              column.applications.length > 0 && (
                <section key={column.status}>
                  <header className="flex items-baseline justify-between border-b-2 border-foreground pb-2">
                    <h2 className="font-mono text-xs tracking-[0.1em] text-foreground uppercase">
                      {column.title}
                    </h2>
                    <span className="font-mono text-xs text-text-secondary">
                      {column.applications.length}
                    </span>
                  </header>

                  <div>
                    {column.applications.map((application) => (
                      <Link
                        key={application.id}
                        to={`/applications/${application.id}`}
                        className="flex items-center justify-between gap-6 border-b border-border-weak py-3.5 hover:bg-zebra"
                      >
                        <div>
                          <span className="text-[0.9375rem] font-medium text-foreground">
                            {application.company}
                          </span>
                          <span className="ml-2.5 text-sm text-text-secondary">
                            {application.position}
                          </span>
                        </div>
                        <span className="font-mono text-[0.625rem] tracking-[0.06em] text-text-tertiary uppercase">
                          {formatShortDate(application.updatedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ),
          )}
        </div>
      )}
    </div>
  )
}
