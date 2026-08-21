import type { ReactNode } from 'react'
import type { Priority } from '@hob/shared'
import { priorityCompanyClassName } from 'shared/helpers/labels'
import { cn } from 'shared/lib/utils'

export interface CardMetaTag {
  text: string
  /** 'accent' for the one urgent tag a card ever carries — a call tomorrow, an offer deadline. */
  tone?: 'default' | 'accent'
}

interface ApplicationCardVisualProps {
  company: string
  position: string
  metaTags: CardMetaTag[]
  /** Offer column cards sit on the soft accent fill — see the mockup's "последняя колонка (Оффер)". */
  isOffer?: boolean
  /** Colors the company name — MEDIUM stays the ordinary heading color, LOW recedes, HIGH takes the accent. Defaults to MEDIUM so a preview with no priority chosen yet still reads correctly. */
  priority?: Priority
  /** The left accent border for a card with something imminent (an interview in the next 24h). */
  accented?: boolean
  /** Quiet-card dimming — an active application untouched past the threshold. */
  dimmed?: boolean
  className?: string
  /** ApplicationCard's "See details →" link — rendered inside the same bordered row, nowhere else needs it. */
  footer?: ReactNode
}

/**
 * The card's pure visual shape, with no drag, no link, no data fetching —
 * split out so the board's real draggable ApplicationCard and the create
 * form's live preview (mockup 1d: "живой рендер карточки в точности как в
 * колонке доски") render identically without the preview having to fake a
 * dnd-kit id or a route it does not have.
 */
export function ApplicationCardVisual({
  company,
  position,
  metaTags,
  isOffer,
  priority = 'MEDIUM',
  accented,
  dimmed,
  className,
  footer,
}: ApplicationCardVisualProps) {
  return (
    <div
      className={cn(
        'border-b border-border-weak px-3 py-3 text-left transition-opacity last:border-b-0',
        accented && 'border-l-2 border-l-highlight pl-[calc(0.75rem-2px)]',
        isOffer && 'bg-highlight-soft',
        dimmed && 'opacity-55',
        className,
      )}
    >
      <h3 className={cn('text-[0.9375rem] font-medium', priorityCompanyClassName(priority))}>
        {company || 'Company'}
      </h3>
      <p className="mt-0.5 text-sm text-text-secondary">{position || 'Position'}</p>

      {metaTags.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-2 font-mono text-[0.625rem] tracking-[0.06em] uppercase">
          {metaTags.map((tag, index) => (
            <span
              key={index}
              className={tag.tone === 'accent' ? 'text-highlight-text' : 'text-text-tertiary'}
            >
              {tag.text}
            </span>
          ))}
        </p>
      )}

      {footer}
    </div>
  )
}
