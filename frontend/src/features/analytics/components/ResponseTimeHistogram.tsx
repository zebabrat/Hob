import type { ResponseTimeBucket } from '@hob/shared'
import { EmptyState } from './EmptyState'

interface ResponseTimeHistogramProps {
  responseTimeDistribution: ResponseTimeBucket[]
}

const BUCKET_LABEL: Record<ResponseTimeBucket['bucket'], string> = {
  '1-2': '1–2 days',
  '3-4': '3–4 days',
  '5-7': '5–7 days',
  '8-14': '8–14 days',
  '15-21': '15–21 days',
  '22-30': '22–30 days',
  '30+': '30+ days',
}

/**
 * "Распределение времени ответа" — when the first response after applying
 * actually tends to arrive. Plain bars, not a line: this is a distribution
 * across independent buckets, not a trend over time.
 */
export function ResponseTimeHistogram({ responseTimeDistribution }: ResponseTimeHistogramProps) {
  const total = responseTimeDistribution.reduce((sum, entry) => sum + entry.count, 0)
  const max = Math.max(...responseTimeDistribution.map((entry) => entry.count), 1)
  const peak = responseTimeDistribution.reduce<ResponseTimeBucket | null>(
    (current, entry) => (current === null || entry.count > current.count ? entry : current),
    null,
  )

  return (
    <section>
      <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        Response time distribution
      </h2>
      {total === 0 ? (
        <EmptyState message="Will show up once an application gets its first response." />
      ) : (
        <div>
          <div className="flex h-32 items-end gap-2.5 border-b border-border">
            {responseTimeDistribution.map((entry) => (
              <div
                key={entry.bucket}
                className="flex-1 bg-border"
                style={{ height: `${Math.max((entry.count / max) * 100, entry.count > 0 ? 4 : 0)}%` }}
                title={`${BUCKET_LABEL[entry.bucket]}: ${entry.count}`}
              />
            ))}
          </div>
          <div className="mt-2.5 flex justify-between">
            <span className="font-mono text-[0.59375rem] tracking-[0.06em] text-text-tertiary uppercase">
              {BUCKET_LABEL['1-2']}
            </span>
            <span className="font-mono text-[0.59375rem] tracking-[0.06em] text-text-tertiary uppercase">
              {BUCKET_LABEL['30+']}
            </span>
          </div>
          {peak && peak.count > 0 && (
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-text-secondary">
              Most first responses land within {BUCKET_LABEL[peak.bucket].toLowerCase()}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
