import { useEffect, useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useSearchParams } from 'react-router'
import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { formatDateTime } from 'shared/helpers/formatDateTime'
import { FormError } from 'shared/components/FormError'
import { Metric } from 'shared/components/Metric'
import { cn } from 'shared/lib/utils'
import { useApplications } from '../hooks/useApplications'
import { useCreateApplication } from '../hooks/useCreateApplication'
import { useUpdateApplicationStatus } from '../hooks/useUpdateApplicationStatus'
import { groupByStatus } from '../helpers/groupByStatus'
import { BoardSkeleton } from './BoardSkeleton'
import { CreateApplicationModal } from './CreateApplicationModal'
import { KanbanColumn } from './KanbanColumn'
import { PipelineView } from './PipelineView'

type QuickFilter = 'remote' | 'recent'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const FILTER_CHIPS: { key: QuickFilter; label: string }[] = [
  { key: 'remote', label: 'Remote' },
  { key: 'recent', label: 'Last 30 days' },
]

function matchesFilters(
  application: ApplicationDto,
  query: string,
  active: Set<QuickFilter>,
): boolean {
  if (query && !application.company.toLowerCase().includes(query)) return false
  if (active.has('remote') && application.workFormat !== 'REMOTE') return false
  if (active.has('recent') && Date.now() - Date.parse(application.appliedDate) > THIRTY_DAYS_MS) {
    return false
  }
  return true
}

export function KanbanBoard() {
  const { applications, isLoading, error, setApplications, addApplication } = useApplications()
  const { move, error: moveError } = useUpdateApplicationStatus(applications, setApplications)
  const create = useCreateApplication(addApplication)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeFilters, setActiveFilters] = useState<Set<QuickFilter>>(new Set())
  const view = searchParams.get('view') === 'time' ? 'time' : 'columns'

  const setView = (next: 'columns' | 'time') => {
    const nextParams = new URLSearchParams(searchParams)
    if (next === 'time') nextParams.set('view', 'time')
    else nextParams.delete('view')
    setSearchParams(nextParams, { replace: true })
  }

  // Without a small threshold a click on a card counts as a drag, and the card
  // never receives an ordinary click.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // ⌘K opens the create form, same as the "+ Application" button — the
  // header's search box is a separate, always-live filter, not a second
  // trigger for this shortcut (see the mockup's Interactions section).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        create.open()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [create])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    // Dropped outside any column: nothing to do.
    if (!over) return

    void move(Number(active.id), over.id as ApplicationStatus)
  }

  // Derived straight from the list already on hand — no extra fetch just to
  // put four numbers in the header. Computed from every application, not the
  // filtered view: the filters narrow what is shown, not what counts.
  const metrics = useMemo(() => {
    const total = applications.length
    const active = applications.filter((application) =>
      (['APPLIED', 'SCREENING', 'INTERVIEW'] as ApplicationStatus[]).includes(application.status),
    ).length
    const interviewing = applications.filter((application) => application.status === 'INTERVIEW')
      .length
    const offers = applications.filter((application) => application.status === 'OFFER').length
    const conversion = total === 0 ? 0 : Math.round((offers / total) * 100)
    return { active, interviewing, offers, conversion }
  }, [applications])

  const lastUpdated = useMemo(() => {
    if (applications.length === 0) return null
    return applications.reduce(
      (latest, application) => (application.updatedAt > latest ? application.updatedAt : latest),
      applications[0]?.updatedAt ?? '',
    )
  }, [applications])

  const query = (searchParams.get('q') ?? '').trim().toLowerCase()
  const filtered = useMemo(
    () => applications.filter((application) => matchesFilters(application, query, activeFilters)),
    [applications, query, activeFilters],
  )
  const columns = useMemo(() => groupByStatus(filtered), [filtered])

  const toggleFilter = (key: QuickFilter) => {
    setActiveFilters((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const viewToggle = (
    <div className="flex gap-3.5">
      {(['columns', 'time'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setView(option)}
          className={cn(
            'border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.08em] uppercase',
            view === option
              ? 'border-foreground text-foreground'
              : 'border-border text-text-secondary',
          )}
        >
          {option === 'columns' ? 'Columns' : 'Time'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-8 pb-2">
        <div>
          <h1 className="text-5xl tracking-[-0.04em] text-foreground">
            {view === 'time' ? 'Pipeline' : 'Applications'}
          </h1>
          {view === 'time' ? (
            <p className="mt-3.5 max-w-xl text-sm text-text-secondary">
              Each row is one application, from sent to its most recent event — where the
              conversation went quiet, not just which column it sits in.
            </p>
          ) : (
            lastUpdated && (
              <p className="mt-3 font-mono text-[0.625rem] tracking-[0.09em] text-text-tertiary uppercase">
                Updated {formatDateTime(lastUpdated)}
              </p>
            )
          )}
        </div>

        {view === 'time' ? (
          viewToggle
        ) : (
          applications.length > 0 && (
            <div className="flex items-end gap-8">
              <div className="flex">
                <Metric label="Active" value={String(metrics.active)} />
                <Metric label="Interviewing" value={String(metrics.interviewing)} />
                <Metric label="Offers" value={String(metrics.offers)} highlight />
                <Metric label="Conversion" value={`${metrics.conversion}%`} />
              </div>
              {viewToggle}
            </div>
          )
        )}
      </header>

      {view === 'columns' && (
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border pb-4.5">
          <button
            type="button"
            onClick={() => setActiveFilters(new Set())}
            className={cn(
              'font-mono text-[0.625rem] tracking-[0.08em] uppercase',
              'border px-2.5 py-1.5',
              activeFilters.size === 0
                ? 'border-foreground text-foreground'
                : 'border-border text-text-secondary',
            )}
          >
            All
          </button>
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => toggleFilter(chip.key)}
              className={cn(
                'font-mono text-[0.625rem] tracking-[0.08em] uppercase',
                'border px-2.5 py-1.5',
                activeFilters.has(chip.key)
                  ? 'border-foreground text-foreground'
                  : 'border-border text-text-secondary',
              )}
            >
              {chip.label}
            </button>
          ))}

          <span className="flex-1" />

          <button
            type="button"
            onClick={create.open}
            className="bg-foreground px-3.5 py-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-primary-foreground uppercase"
          >
            + Application
          </button>
        </div>
      )}

      {/* A failed move is reported here rather than on the card, which has
          already snapped back to where it started. */}
      <FormError message={error ?? moveError} />

      {isLoading ? (
        <BoardSkeleton />
      ) : view === 'time' ? (
        <PipelineView applications={filtered} />
      ) : applications.length === 0 ? (
        <p className="border-t border-border py-16 text-center font-mono text-xs tracking-[0.08em] text-text-tertiary uppercase">
          No applications yet — press ⌘K to add the first one
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Four equal columns, per the mockup's "CSS grid 4 колонки равной
              ширины" — each column draws its own right border rather than this
              row using a gap, so a shared hairline sits between two touching
              columns instead of a gap with the page background showing through. */}
          <div className="grid grid-cols-4 border-t border-border">
            {columns.map((column) => (
              <KanbanColumn key={column.status} column={column} />
            ))}
          </div>
        </DndContext>
      )}

      <CreateApplicationModal
        isOpen={create.isOpen}
        isSubmitting={create.isSubmitting}
        error={create.error}
        onClose={create.close}
        onSubmit={(values, keepOpen) => void create.submit(values, keepOpen)}
      />
    </div>
  )
}
