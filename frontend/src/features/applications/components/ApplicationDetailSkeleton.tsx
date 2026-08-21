import { Skeleton } from 'shared/components/Skeleton'

/** Shaped like ApplicationDetail's real layout: breadcrumb bar, hero, then the two-column body. */
export function ApplicationDetailSkeleton() {
  return (
    <div>
      <div className="mb-9 flex items-center justify-between border-b border-border pb-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-24" />
      </div>

      <div className="mb-9 border-b border-border pb-8">
        <Skeleton className="h-16 w-96" />
        <Skeleton className="mt-4 h-5 w-64" />
        <div className="mt-7.5 flex border-l border-border-weak">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="border-l border-border-weak px-6 first:border-l-0 first:pl-0">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="mt-2 h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-10 lg:border-r lg:border-border lg:pr-10">
          <Skeleton className="h-3 w-24" />
          <div className="-mt-6 flex flex-col gap-4">
            {[0, 1].map((index) => (
              <div key={index} className="grid grid-cols-[5.75rem_1fr] gap-4 border-t border-border-weak py-4">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-9">
          <Skeleton className="h-3 w-16" />
          <div className="-mt-5 flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
