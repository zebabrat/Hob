import { useDroppable } from '@dnd-kit/core'
import { cn } from 'shared/lib/utils'
import type { ApplicationColumn } from '../types'
import { ApplicationCard } from './ApplicationCard'

interface KanbanColumnProps {
  column: ApplicationColumn
}

export function KanbanColumn({ column }: KanbanColumnProps) {
  // The status is the drop target id, so the board reads the destination
  // straight off the event without a lookup.
  const { setNodeRef, isOver } = useDroppable({ id: column.status })

  return (
    <section
      ref={setNodeRef}
      // w-72 shrink-0: a fixed width per column is what makes the board's own
      // overflow-x-auto (in KanbanBoard) scroll horizontally instead of
      // squeezing six columns into whatever width the viewport happens to be.
      // Column background is the zebra tint per the mockup ("зебра/фон
      // колонки"); its own right border is what separates it from the next
      // column, not a gap.
      className="flex max-h-[calc(100dvh-20rem)] w-72 shrink-0 flex-col border-r border-border-weak bg-zebra"
    >
      <header className="flex items-baseline justify-between border-b-2 border-foreground px-3 pt-3 pb-2">
        <h2 className="font-mono text-xs tracking-[0.08em] text-foreground uppercase">
          {column.title}
        </h2>
        <span className="font-mono text-xs text-text-secondary">{column.applications.length}</span>
      </header>

      {/* The column's own scroll, independent of the page — a busy column
          grows a scrollbar instead of pushing the others further down. */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-y-auto border-t-2 border-dashed border-transparent transition-colors',
          isOver && 'border-highlight',
        )}
      >
        {column.applications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}

        {isOver && (
          <div className="mx-3 my-2 border border-dashed border-highlight px-3 py-2 text-center">
            <span className="font-mono text-[0.625rem] tracking-[0.08em] text-highlight-text uppercase">
              Drop here
            </span>
          </div>
        )}

        {column.applications.length === 0 && !isOver && (
          <p className="px-3 py-8 text-center font-mono text-[0.625rem] tracking-[0.08em] text-text-tertiary uppercase">
            Nothing here yet
          </p>
        )}
      </div>
    </section>
  )
}
