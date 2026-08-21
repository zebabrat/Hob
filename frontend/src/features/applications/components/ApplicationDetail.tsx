import { useState } from 'react'
import { Link } from 'react-router'
import type { ApplicationStatus } from '@hob/shared'
import { DEFAULT_CURRENCY_SYMBOL, formatSalary } from 'shared/helpers/formatSalary'
import { formatShortDate } from 'shared/helpers/formatShortDate'
import { salaryTypeLabel, statusLabel, workFormatLabel } from 'shared/helpers/labels'
import { FormError } from 'shared/components/FormError'
import { cn } from 'shared/lib/utils'
import { applicationToEditValues } from '../helpers/formValues'
import { daysInProcess, buildStatusTimeline } from '../helpers/statusTimeline'
import { useApplicationDetail } from '../hooks/useApplicationDetail'
import { useAttachments } from '../hooks/useAttachments'
import { useInterviews } from '../hooks/useInterviews'
import { useUpdateApplication } from '../hooks/useUpdateApplication'
import { ApplicationDetailSkeleton } from './ApplicationDetailSkeleton'
import { ApplicationEditForm } from './ApplicationEditForm'
import { AttachmentList } from './AttachmentList'
import { AttachmentUpload } from './AttachmentUpload'
import { InterviewList } from './InterviewList'

interface ApplicationDetailProps {
  id: number
}

function BreadcrumbBar({
  status,
  onArchive,
  onAcceptOffer,
  isBusy,
}: {
  status: ApplicationStatus
  onArchive: () => void
  onAcceptOffer: () => void
  isBusy: boolean
}) {
  const isResolved = status === 'ACCEPTED' || status === 'REJECTED' || status === 'WITHDRAWN'

  return (
    <div className="mb-9 flex items-center justify-between border-b border-border pb-5">
      <div className="flex items-center gap-3 font-mono text-[0.65625rem] tracking-[0.09em] uppercase">
        <Link to="/board" className="text-text-secondary hover:text-foreground">
          ← Board
        </Link>
        <span className="text-border">/</span>
        <span className={cn(status === 'OFFER' ? 'text-highlight-text' : 'text-foreground')}>
          {statusLabel(status)}
        </span>
      </div>

      {!isResolved && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onArchive}
            disabled={isBusy}
            className="border border-border px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase disabled:opacity-50"
          >
            Archive
          </button>
          {status === 'OFFER' && (
            <button
              type="button"
              onClick={onAcceptOffer}
              disabled={isBusy}
              className="bg-foreground px-3.5 py-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-primary-foreground uppercase disabled:opacity-50"
            >
              Accept offer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-border-weak px-6 first:border-l-0 first:pl-0">
      <div className="font-mono text-[0.59375rem] tracking-[0.09em] text-text-tertiary uppercase">
        {label}
      </div>
      <div className="mt-1.5 text-base text-foreground">{value}</div>
    </div>
  )
}

/**
 * The right sidebar's vertical progression — four forward steps plus a fifth
 * "Decision" rung, which fills once the application resolves one way or
 * another (accepted/rejected/withdrawn). Dates come from the real
 * StatusChange audit trail, not a guess.
 */
function StatusTimeline({ application }: { application: NonNullable<ReturnType<typeof useApplicationDetail>['application']> }) {
  const { steps, decision } = buildStatusTimeline(application)

  return (
    <div className="flex flex-col">
      {steps.map((step) => (
        <div
          key={step.status}
          className={cn(
            'flex items-center gap-2.5 py-2',
            step.isCurrent && 'bg-highlight-soft -mx-2 px-2',
          )}
        >
          <span className={cn('size-1.5 shrink-0', (step.isPast || step.isCurrent) && 'bg-foreground')}
            style={!(step.isPast || step.isCurrent) ? { border: '1px solid var(--border-weak)' } : undefined}
          />
          <span className="font-mono text-[0.625rem] tracking-[0.06em] text-foreground uppercase">
            {statusLabel(step.status)}
          </span>
          <span className="ml-auto font-mono text-[0.59375rem] text-text-tertiary">
            {step.enteredAt ? formatShortDate(step.enteredAt) : ''}
          </span>
        </div>
      ))}
      <div
        className={cn(
          'flex items-center gap-2.5 py-2',
          decision.reached && 'bg-highlight-soft -mx-2 px-2',
        )}
      >
        <span
          className={cn('size-1.5 shrink-0', decision.reached && 'bg-foreground')}
          style={!decision.reached ? { border: '1px solid var(--border-weak)' } : undefined}
        />
        <span
          className={cn(
            'font-mono text-[0.625rem] tracking-[0.06em] uppercase',
            decision.reached ? 'text-foreground' : 'text-text-quaternary',
          )}
        >
          {decision.status ? statusLabel(decision.status) : 'Decision'}
        </span>
        <span className="ml-auto font-mono text-[0.59375rem] text-text-tertiary">
          {decision.enteredAt ? formatShortDate(decision.enteredAt) : ''}
        </span>
      </div>
    </div>
  )
}

export function ApplicationDetail({ id }: ApplicationDetailProps) {
  const { application, setApplication, isLoading, error: loadError } = useApplicationDetail(id)
  // Called unconditionally, ahead of the loading/not-found branches below:
  // each only needs setApplication, which is stable from the first render, so
  // none of them has to wait for `application` itself to exist.
  const updateApp = useUpdateApplication(id, setApplication)
  const interviews = useInterviews(id, setApplication)
  const attachments = useAttachments(id, setApplication)
  const [notesDraft, setNotesDraft] = useState<string | null>(null)

  if (isLoading) {
    return <ApplicationDetailSkeleton />
  }

  if (loadError) {
    return (
      <div>
        <Link
          to="/board"
          className="mb-6 inline-block font-mono text-xs tracking-[0.06em] text-text-secondary uppercase hover:text-foreground"
        >
          ← Board
        </Link>
        <FormError message={loadError} />
      </div>
    )
  }

  // Reached only if the load neither succeeded nor failed, which the hook
  // never actually does — this is here so TypeScript can narrow the rest of
  // the component to a non-null application without an assertion.
  if (!application) return null

  const editValues = applicationToEditValues(application)
  const salary = formatSalary(application.salary)
  const salaryType = salaryTypeLabel(application.salaryType)
  const workFormat = workFormatLabel(application.workFormat)
  const days = daysInProcess(application)

  const notes = notesDraft ?? editValues.notes
  const notesChanged = notesDraft !== null && notesDraft !== editValues.notes
  const saveNotes = () => {
    void updateApp.save({ ...editValues, notes }).then(() => setNotesDraft(null))
  }

  return (
    <div>
      <BreadcrumbBar
        status={application.status}
        isBusy={updateApp.isSubmitting}
        onArchive={() => void updateApp.save({ ...editValues, status: 'WITHDRAWN' })}
        onAcceptOffer={() => void updateApp.save({ ...editValues, status: 'ACCEPTED' })}
      />

      <div className="mb-9 border-b border-border pb-8">
        {application.status === 'OFFER' && application.offerDeadline && (
          <p className="mb-3.5 font-mono text-[0.65625rem] tracking-[0.1em] text-highlight-text uppercase">
            Reply by {formatShortDate(application.offerDeadline)}
          </p>
        )}
        <h1 className="text-[3.875rem] leading-[0.92] tracking-[-0.045em] text-foreground">
          {application.company}
        </h1>
        <p className="mt-3.5 text-xl tracking-[-0.01em] text-text-secondary">
          {application.position}
          {workFormat && ` · ${workFormat}`}
        </p>

        <div className="mt-7.5 flex flex-wrap border-l border-border-weak">
          <HeroMetric
            label="Salary"
            value={
              salary
                ? `${DEFAULT_CURRENCY_SYMBOL}${salary} /mo${salaryType ? ` (${salaryType})` : ''}`
                : '—'
            }
          />
          <HeroMetric label="Applied" value={formatShortDate(application.appliedDate)} />
          <HeroMetric label="In process" value={`${days} ${days === 1 ? 'day' : 'days'}`} />
          <HeroMetric
            label="Source"
            value={application.source.length > 0 ? application.source.join(', ') : '—'}
          />
          <HeroMetric label="Recruiter" value={application.recruiter ?? '—'} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-10 lg:border-r lg:border-border lg:pr-10">
          <section>
            <h2 className="mb-1 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
              Interviews
            </h2>
            <InterviewList
              interviews={application.interviews}
              pendingId={interviews.pendingId}
              error={interviews.error}
              onAdd={interviews.add}
              onUpdate={interviews.update}
              onDelete={(interviewId) => void interviews.remove(interviewId)}
            />
          </section>

          <section>
            <h2 className="mb-1 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
              Notes
            </h2>
            <div className="border-t border-border-weak pt-3">
              <textarea
                value={notes}
                onChange={(event) => setNotesDraft(event.target.value)}
                placeholder="Write a note…"
                rows={3}
                className="w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-foreground outline-none placeholder:text-text-tertiary"
              />
              {notesChanged && (
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={updateApp.isSubmitting}
                    className="font-mono text-[0.625rem] tracking-[0.07em] text-foreground uppercase underline underline-offset-2"
                  >
                    Save note
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotesDraft(null)}
                    className="font-mono text-[0.625rem] tracking-[0.07em] text-text-tertiary uppercase"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>

          <ApplicationEditForm
            key={application.updatedAt}
            application={application}
            editValues={editValues}
            isSubmitting={updateApp.isSubmitting}
            error={updateApp.error}
            onSave={(values) => void updateApp.save(values)}
          />
        </div>

        <div className="flex flex-col gap-9">
          <section>
            <h2 className="mb-4.5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
              Status
            </h2>
            <StatusTimeline application={application} />
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="mb-3.5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
              Attachments
            </h2>
            <AttachmentList
              attachments={application.attachments}
              deletingId={attachments.deletingId}
              onDelete={(attachmentId) => void attachments.remove(attachmentId)}
            />
            <div className="mt-3">
              <AttachmentUpload
                isUploading={attachments.isUploading}
                error={attachments.error}
                onUpload={(file) => void attachments.upload(file)}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
