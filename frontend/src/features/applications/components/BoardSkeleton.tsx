import { Skeleton } from 'shared/components/Skeleton'

/** One placeholder card, shaped like ApplicationCardVisual: title, subtitle, a meta line. */
function CardSkeleton() {
  return (
    <div className="border-b border-border-weak px-3 py-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-3 h-2.5 w-2/5" />
    </div>
  )
}

/** Four columns, shaped like KanbanColumn, each with a couple of card placeholders — mimics the board's real layout so nothing jumps once data arrives. */
export function BoardSkeleton() {
  return (
    <div className="grid grid-cols-4 border-t border-border">
      {[3, 2, 3, 1].map((cardCount, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-col border-r border-border-weak bg-zebra last:border-r-0"
        >
          <div className="flex items-baseline justify-between border-b-2 border-border-weak px-3 pt-3 pb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-4" />
          </div>
          {Array.from({ length: cardCount }, (_, cardIndex) => (
            <CardSkeleton key={cardIndex} />
          ))}
        </div>
      ))}
    </div>
  )
}
