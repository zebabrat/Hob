import { useDraggable } from '@dnd-kit/core'
import { Link } from 'react-router'
import type { ApplicationDto } from '@hob/shared'
import { applicationCardMetaTags } from '../helpers/cardMetaTags'
import { isQuiet, upcomingInterview } from '../helpers/cardSignals'
import { ApplicationCardVisual } from './ApplicationCardVisual'

interface ApplicationCardProps {
  application: ApplicationDto
}

/**
 * A flush list row, not a boxed card — the mockup's kanban cards sit
 * directly on the column's zebra background, separated from each other by
 * a bottom hairline rather than a gap between individual surfaces. The
 * visual shape itself lives in ApplicationCardVisual; this component adds
 * drag-and-drop, the link to the detail page, and the real-data signals
 * (quiet, upcoming interview) that visual alone cannot know.
 */
export function ApplicationCard({ application }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  })

  const metaTags = applicationCardMetaTags(application)
  const accented = upcomingInterview(application) !== null
  const dimmed = isQuiet(application)

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
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
    >
      <ApplicationCardVisual
        company={application.company}
        position={application.position}
        metaTags={metaTags}
        isOffer={application.status === 'OFFER'}
        priority={application.priority}
        accented={accented}
        dimmed={dimmed}
        footer={
          // The only way into the detail page. The card itself stays entirely
          // dnd-kit's — drag listeners cover the whole article — so this needs
          // its own stopPropagation: without it, pressing the link starts a
          // drag (PointerSensor sees the same pointerdown) before the click
          // can land.
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
        }
      />
    </article>
  )
}
