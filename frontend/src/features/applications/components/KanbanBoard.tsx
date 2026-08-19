import { useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ApplicationStatus } from '@hob/shared'
import { FormError } from 'shared/components/FormError'
import { Metric } from 'shared/components/Metric'
import { Button } from 'shared/components/ui/button'
import { useApplications } from '../hooks/useApplications'
import { useCreateApplication } from '../hooks/useCreateApplication'
import { useUpdateApplicationStatus } from '../hooks/useUpdateApplicationStatus'
import { CreateApplicationModal } from './CreateApplicationModal'
import { KanbanColumn } from './KanbanColumn'

export function KanbanBoard() {
  const { applications, columns, isLoading, error, setApplications, addApplication } =
    useApplications()
  const { move, error: moveError } = useUpdateApplicationStatus(applications, setApplications)
  const create = useCreateApplication(addApplication)

  // Without a small threshold a click on a card counts as a drag, and the card
  // never receives an ordinary click.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    // Dropped outside any column: nothing to do.
    if (!over) return

    void move(Number(active.id), over.id as ApplicationStatus)
  }

  // Derived straight from the list already on hand — no extra fetch just to
  // put four numbers in the header.
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-8">
        <h1 className="text-5xl tracking-[-0.03em] text-foreground">Applications</h1>

        {applications.length > 0 && (
          <div className="flex gap-4">
            <Metric label="Active" value={String(metrics.active)} />
            <Metric label="Interviewing" value={String(metrics.interviewing)} />
            <Metric label="Offers" value={String(metrics.offers)} />
            <Metric label="Conversion" value={`${metrics.conversion}%`} highlight />
          </div>
        )}
      </header>

      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="font-mono text-xs tracking-[0.08em] text-text-secondary uppercase">
          {applications.length} total
        </span>
        <Button onClick={create.open}>+ Application</Button>
      </div>

      {/* A failed move is reported here rather than on the card, which has
          already snapped back to where it started. */}
      <FormError message={error ?? moveError} />

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Horizontal scroll, not a wrap: six fixed-width columns always
              fit some width, and the page itself never needs to widen. Each
              column draws its own right border (see KanbanColumn) rather
              than this row using a gap — a shared hairline between two
              touching columns, not a gap with color showing through. */}
          <div className="flex overflow-x-auto border-t border-border pb-4">
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
        onSubmit={(values) => void create.submit(values)}
      />
    </div>
  )
}
