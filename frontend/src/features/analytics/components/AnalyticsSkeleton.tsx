import { Skeleton } from 'shared/components/Skeleton'

/** One placeholder section: a title bar over a block of "chart", no card box — matches the real sections' bare layout. */
function SectionSkeleton() {
  return (
    <div>
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="mt-5 h-32 w-full" />
    </div>
  )
}

/** Shaped like AnalyticsDashboard's real layout: a hero-metrics row, then two hairline-divided panels of stacked sections each. */
export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 border-t border-b border-border sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="border-r border-border-weak px-7 py-6.5 last:border-r-0">
            <Skeleton className="h-11 w-16" />
            <Skeleton className="mt-3 h-2.5 w-20" />
          </div>
        ))}
      </div>

      {[0, 1].map((row) => (
        <div key={row} className="grid grid-cols-1 border-t border-border lg:grid-cols-2">
          <div className="flex flex-col gap-9 py-8 lg:border-r lg:border-border lg:pr-9">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
          <div className="flex flex-col gap-9 py-8 lg:pl-9">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}
