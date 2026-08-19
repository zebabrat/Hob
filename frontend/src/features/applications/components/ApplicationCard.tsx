import { useDraggable } from '@dnd-kit/core'
import { Link } from 'react-router'
import type { ApplicationDto } from '@hob/shared'
import { formatSalary } from 'shared/helpers/formatSalary'
import { formatShortDate } from 'shared/helpers/formatShortDate'
import { workFormatLabel } from 'shared/helpers/labels'
import { cn } from 'shared/lib/utils'

interface ApplicationCardProps {
  application: ApplicationDto
}

/**
 * A flush list row, not a boxed card — the mockup's kanban cards sit
 * directly on the column's zebra background, separated from each other by
 * a bottom hairline rather than a gap between individual surfaces. The one
 * exception is Offer: those rows get the soft accent fill per "последняя
 * колонка (Оффер) — карточки на мягком акцентном фоне".
 */
export function ApplicationCard({ application }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  })

  const salary = formatSalary(application.salary)
  const workFormat = workFormatLabel(application.workFormat)
  const rounds = application.interviews.length
  const files = application.attachments.length
  const isOffer = application.status === 'OFFER'

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        // Written out rather than taken from @dnd-kit/utilities, which is not a
        // direct dependency here.
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      className={cn(
        'cursor-grab touch-none border-b border-border-weak px-3 py-3 text-left transition-opacity last:border-b-0 active:cursor-grabbing',
        isOffer && 'bg-highlight-soft',
        isDragging && 'opacity-40',
      )}
    >
      <h3 className="text-[0.9375rem] font-medium text-foreground">{application.company}</h3>
      <p className="mt-0.5 text-sm text-text-secondary">{application.position}</p>

      <p className="mt-2 flex flex-wrap gap-x-2 font-mono text-[0.625rem] tracking-[0.06em] text-text-tertiary uppercase">
        <span>{formatShortDate(application.appliedDate)}</span>
        {workFormat && <span>{workFormat}</span>}
        {salary && <span>{salary}</span>}
        {rounds > 0 && <span>{rounds === 1 ? '1 round' : `${rounds} rounds`}</span>}
        {files > 0 && <span>{files === 1 ? '1 file' : `${files} files`}</span>}
      </p>

      {/*
       * The only way into the detail page. The card itself stays entirely
       * dnd-kit's — drag listeners cover the whole article — so this needs its
       * own stopPropagation: without it, pressing the link starts a drag
       * (PointerSensor sees the same pointerdown) before the click can land.
       */}
      <div className="mt-2 flex justify-end">
        <Link
          to={`/applications/${application.id}`}
          onPointerDown={(event) => event.stopPropagation()}
          // cursor overrides the article's cursor-grab, which this element
          // would otherwise inherit despite not being draggable itself.
          className="cursor-pointer font-mono text-[0.625rem] tracking-[0.06em] text-text-secondary uppercase hover:text-foreground"
        >
          See details →
        </Link>
      </div>
    </article>
  )
}
