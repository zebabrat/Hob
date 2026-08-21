import { Skeleton } from 'shared/components/Skeleton'

/** Shaped like ArchiveList's real output: a section header, a handful of underlined rows. */
export function ArchiveSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {[3, 2].map((rowCount, sectionIndex) => (
        <section key={sectionIndex}>
          <header className="flex items-baseline justify-between border-b-2 border-border-weak pb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-4" />
          </header>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center justify-between gap-6 border-b border-border-weak py-3.5"
            >
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
