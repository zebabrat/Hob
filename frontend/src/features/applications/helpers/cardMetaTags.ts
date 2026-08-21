import type { ApplicationDto } from '@hob/shared'
import { DEFAULT_CURRENCY_SYMBOL, formatSalary } from 'shared/helpers/formatSalary'
import { formatShortDate } from 'shared/helpers/formatShortDate'
import { workFormatLabel } from 'shared/helpers/labels'
import type { CardMetaTag } from '../components/ApplicationCardVisual'
import { formatUpcomingInterview, isQuiet, quietDays, upcomingInterview } from './cardSignals'

/**
 * The row of small mono tags under a card's title — date/source/format in
 * the ordinary case, replaced by whichever single urgent signal applies
 * (an imminent call, quiet-too-long, or — on an Offer card — the salary and
 * response deadline) per the mockup's kanban card spec. Built once here so
 * the board card and the create form's live preview read the same tags.
 */
export function applicationCardMetaTags(application: ApplicationDto, now: Date = new Date()): CardMetaTag[] {
  const soon = upcomingInterview(application, now)
  if (soon?.scheduledAt) {
    return [{ text: formatUpcomingInterview(soon.scheduledAt, now).toUpperCase(), tone: 'accent' }]
  }

  if (application.status === 'OFFER') {
    const salary = formatSalary(application.salary)
    const tags: CardMetaTag[] = []
    if (salary) tags.push({ text: `${DEFAULT_CURRENCY_SYMBOL} ${salary} / MO` })
    if (application.offerDeadline) {
      tags.push({
        text: `REPLY BY ${formatShortDate(application.offerDeadline)}`,
        tone: 'accent',
      })
    }
    if (tags.length > 0) return tags
  }

  if (isQuiet(application, now)) {
    return [
      { text: formatShortDate(application.appliedDate) },
      { text: `QUIET ${quietDays(application, now)}D` },
    ]
  }

  const tags: CardMetaTag[] = [{ text: formatShortDate(application.appliedDate) }]
  if (application.source.length > 0) {
    const [first, ...rest] = application.source
    const suffix = rest.length > 0 ? ` +${rest.length}` : ''
    tags.push({ text: `${first?.toUpperCase()}${suffix}` })
  }
  const workFormat = workFormatLabel(application.workFormat)
  if (workFormat) tags.push({ text: workFormat.toUpperCase() })
  return tags
}
