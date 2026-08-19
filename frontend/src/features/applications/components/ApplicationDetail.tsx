import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { APPLICATION_STATUSES } from '@hob/shared'
import type { ApplicationStatus } from '@hob/shared'
import { formatSalary } from 'shared/helpers/formatSalary'
import { formatShortDate } from 'shared/helpers/formatShortDate'
import { statusLabel, workFormatLabel } from 'shared/helpers/labels'
import { FormError } from 'shared/components/FormError'
import { Metric } from 'shared/components/Metric'
import { SubmitButton } from 'shared/components/SubmitButton'
import { TextField } from 'shared/components/TextField'
import { Card, CardContent, CardHeader, CardTitle } from 'shared/components/ui/card'
import { Label } from 'shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'shared/components/ui/select'
import { cn } from 'shared/lib/utils'
import {
  UNSPECIFIED_WORK_FORMAT,
  applicationToEditValues,
  readApplicationEditValues,
  workFormatSelectLabel,
} from '../helpers/formValues'
import { useApplicationDetail } from '../hooks/useApplicationDetail'
import { useAttachments } from '../hooks/useAttachments'
import { useInterviews } from '../hooks/useInterviews'
import { useUpdateApplication } from '../hooks/useUpdateApplication'
import { AttachmentList } from './AttachmentList'
import { AttachmentUpload } from './AttachmentUpload'
import { InterviewList } from './InterviewList'
import { TextAreaField } from './TextAreaField'

interface ApplicationDetailProps {
  id: number
}

// The pipeline order a normal application moves through. Rejected/Withdrawn
// are terminal off-ramps from any step, not a fifth and sixth rung on this
// same ladder, so the stepper below draws them as a separate note rather
// than appending them to the line.
const PIPELINE_STEPS: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

function BackToBoardLink({ status }: { status: ApplicationStatus }) {
  return (
    <div className="mb-8 flex items-center gap-2 font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">
      <Link to="/board" className="hover:text-foreground">
        ← Board
      </Link>
      <span className="text-text-tertiary">/</span>
      <span className={cn(status === 'OFFER' && 'text-highlight-text')}>{statusLabel(status)}</span>
    </div>
  )
}

/**
 * Applied/Screening/Interview/Offer as a vertical progression, Rejected and
 * Withdrawn called out separately — a normal application only ever moves
 * forward through the first four, never through the last two on its way
 * to something else. Built entirely from the status field already on the
 * application; no data this app doesn't have.
 */
function StatusStepper({ status }: { status: ApplicationStatus }) {
  const isOffTrack = status === 'REJECTED' || status === 'WITHDRAWN'
  const currentIndex = PIPELINE_STEPS.indexOf(status)

  return (
    <div className="flex flex-col gap-3">
      {PIPELINE_STEPS.map((step, index) => {
        const isPast = !isOffTrack && index < currentIndex
        const isCurrent = !isOffTrack && index === currentIndex
        return (
          <div key={step} className="flex items-center gap-3">
            <span
              className={cn(
                'size-2 shrink-0 border border-foreground',
                (isPast || isCurrent) && 'bg-foreground',
              )}
            />
            <span
              className={cn(
                'font-mono text-xs tracking-[0.06em] uppercase',
                isCurrent ? 'text-foreground' : 'text-text-secondary',
              )}
            >
              {statusLabel(step)}
            </span>
          </div>
        )
      })}

      {isOffTrack && (
        <div className="mt-1 flex items-center gap-3 border-t border-border-weak pt-3">
          <span className="size-2 shrink-0 bg-destructive" />
          <span className="font-mono text-xs tracking-[0.06em] text-destructive uppercase">
            {statusLabel(status)}
          </span>
        </div>
      )}
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

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading…</p>
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

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void updateApp.save(readApplicationEditValues(event.currentTarget))
  }

  const editValues = applicationToEditValues(application)
  const salary = formatSalary(application.salary)
  const workFormat = workFormatLabel(application.workFormat)

  return (
    <div>
      <BackToBoardLink status={application.status} />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl tracking-[-0.03em] text-foreground">{application.company}</h1>
          <p className="mt-2 text-lg text-text-secondary">
            {application.position}
            {workFormat && ` · ${workFormat}`}
          </p>
        </div>

        <div className="flex gap-6">
          <Metric size="sm" label="Salary" value={salary ?? '—'} />
          <Metric size="sm" label="Applied" value={formatShortDate(application.appliedDate)} />
          <Metric size="sm" label="Interviews" value={String(application.interviews.length)} />
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
                <FormError message={updateApp.error} />

                <TextField
                  label="Company"
                  name="company"
                  defaultValue={editValues.company}
                  required
                  disabled={updateApp.isSubmitting}
                />

                <TextField
                  label="Position"
                  name="position"
                  defaultValue={editValues.position}
                  required
                  disabled={updateApp.isSubmitting}
                />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="application-status">Status</Label>
                  <Select
                    name="status"
                    defaultValue={editValues.status}
                    disabled={updateApp.isSubmitting}
                  >
                    <SelectTrigger id="application-status" className="w-full">
                      {/* See workFormatSelectLabel's comment below — this
                          installed Base UI Select does not resolve a
                          selected item's label on its own. */}
                      <SelectValue>
                        {(value: ApplicationStatus) => statusLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <TextField
                  label="Applied on"
                  name="appliedDate"
                  type="date"
                  defaultValue={editValues.appliedDate}
                  required
                  disabled={updateApp.isSubmitting}
                />

                <TextField
                  label="Salary"
                  name="salary"
                  type="number"
                  min={0}
                  defaultValue={editValues.salary}
                  hint="Optional"
                  disabled={updateApp.isSubmitting}
                />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="application-work-format">Work format</Label>
                  <Select
                    name="workFormat"
                    defaultValue={editValues.workFormat || UNSPECIFIED_WORK_FORMAT}
                    disabled={updateApp.isSubmitting}
                  >
                    <SelectTrigger id="application-work-format" className="w-full">
                      <SelectValue>{(value: string) => workFormatSelectLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSPECIFIED_WORK_FORMAT}>Not specified</SelectItem>
                      <SelectItem value="REMOTE">{workFormatLabel('REMOTE')}</SelectItem>
                      <SelectItem value="HYBRID">{workFormatLabel('HYBRID')}</SelectItem>
                      <SelectItem value="ONSITE">{workFormatLabel('ONSITE')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <TextField
                    label="Job posting"
                    name="jobUrl"
                    type="url"
                    defaultValue={editValues.jobUrl}
                    hint="Optional"
                    disabled={updateApp.isSubmitting}
                  />
                  {/*
                   * Points at the saved jobUrl, not whatever is currently typed in
                   * the field above — the input is uncontrolled, so there is no
                   * live value in JavaScript to link to until Save commits it.
                   * The link catches up once it does.
                   */}
                  {application.jobUrl && (
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-block text-sm text-text-secondary underline underline-offset-2 hover:text-foreground"
                    >
                      Open job posting ↗
                    </a>
                  )}
                </div>

                <TextAreaField
                  label="Summary"
                  name="summary"
                  defaultValue={editValues.summary}
                  hint="Optional"
                  disabled={updateApp.isSubmitting}
                />

                <TextAreaField
                  label="Notes"
                  name="notes"
                  defaultValue={editValues.notes}
                  hint="Optional"
                  disabled={updateApp.isSubmitting}
                />

                <SubmitButton isSubmitting={updateApp.isSubmitting} pendingLabel="Saving…">
                  Save
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview rounds</CardTitle>
            </CardHeader>
            <CardContent>
              <InterviewList
                interviews={application.interviews}
                pendingId={interviews.pendingId}
                error={interviews.error}
                onAdd={interviews.add}
                onUpdate={interviews.update}
                onDelete={(interviewId) => void interviews.remove(interviewId)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:w-80 lg:shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusStepper status={application.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <AttachmentList
                attachments={application.attachments}
                deletingId={attachments.deletingId}
                onDelete={(attachmentId) => void attachments.remove(attachmentId)}
              />
              <AttachmentUpload
                isUploading={attachments.isUploading}
                error={attachments.error}
                onUpload={(file) => void attachments.upload(file)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
