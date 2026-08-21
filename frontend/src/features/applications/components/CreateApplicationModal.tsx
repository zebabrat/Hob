import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { XIcon } from 'lucide-react'
import { PRIORITY_LEVELS } from '@hob/shared'
import type { ApplicationStatus } from '@hob/shared'
import { DATE_INPUT_MAX, DATE_INPUT_MIN } from 'shared/helpers/dateBounds'
import { DEFAULT_CURRENCY_SYMBOL } from 'shared/helpers/formatSalary'
import { priorityLabel, statusLabel } from 'shared/helpers/labels'
import { FormError } from 'shared/components/FormError'
import { Dialog, DialogContent, DialogTitle } from 'shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'shared/components/ui/select'
import { cn } from 'shared/lib/utils'
import { BOARD_STATUS_ORDER } from '../helpers/groupByStatus'
import {
  UNSPECIFIED_SALARY_TYPE,
  UNSPECIFIED_WORK_FORMAT,
  salaryTypeSelectLabel,
  sanitizeSalaryDigits,
  workFormatSelectLabel,
} from '../helpers/formValues'
import { applicationCardMetaTags } from '../helpers/cardMetaTags'
import type { ApplicationFormValues } from '../types'
import { ApplicationCardVisual } from './ApplicationCardVisual'
import { LabelsField } from './LabelsField'
import { PositionField } from './PositionField'
import { SourceField } from './SourceField'

interface CreateApplicationModalProps {
  isOpen: boolean
  isSubmitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: ApplicationFormValues, keepOpen: boolean) => void
}

const TODAY = new Date().toISOString().slice(0, 10)

/** Every field label in this form, whatever control it sits above — one size, one color, one gap to the control below it. */
const FIELD_LABEL_CLASSNAME =
  'mb-2 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase'

/**
 * A Select restyled to read as the same field as the plain text inputs
 * around it — same border-b, same padding, same 19px type — rather than
 * shadcn's compact default. `data-[size=default]:h-auto` targets the exact
 * variant selector SelectTrigger's own `data-[size=default]:h-8` uses, which
 * is the only way to unseat it: a plain `h-auto` loses that specificity
 * fight and the trigger stays 32px tall while every input beside it is 50px,
 * which is the "jumps by row" bug this constant exists to prevent.
 */
const SELECT_TRIGGER_CLASSNAME =
  'w-full border-0 border-b border-border bg-transparent px-0 py-2.5 text-[1.1875rem] text-foreground data-[size=default]:h-auto'

function emptyDraft(): ApplicationFormValues {
  return {
    company: '',
    position: '',
    recruiter: '',
    status: 'APPLIED',
    priority: 'MEDIUM',
    appliedDate: TODAY,
    salary: '',
    // Most listings quote gross, so a new draft starts there rather than on
    // "Not specified" — one less click for the common case, still changeable.
    salaryType: 'GROSS',
    workFormat: 'REMOTE',
    jobUrl: '',
    source: [],
    labels: [],
    notes: '',
  }
}

/** For the live preview only — a card built from an in-progress draft has no id, interviews or attachments yet. */
function draftToPreview(draft: ApplicationFormValues) {
  return {
    id: 0,
    userId: 0,
    company: draft.company,
    position: draft.position,
    recruiter: draft.recruiter || null,
    status: draft.status,
    priority: draft.priority,
    salary: draft.salary ? Number(draft.salary) : null,
    salaryType: draft.salaryType ? (draft.salaryType as never) : null,
    workFormat: draft.workFormat ? (draft.workFormat as never) : null,
    jobUrl: null,
    source: draft.source,
    offerDeadline: null,
    labels: draft.labels,
    summary: null,
    notes: null,
    appliedDate: new Date(draft.appliedDate || TODAY).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: [],
    attachments: [],
    statusChanges: [],
  }
}

/**
 * Rebuilt as a two-column, fully-controlled form per mockup 1d: the right
 * panel's live preview needs every field's current value on every keystroke,
 * which an uncontrolled FormData-on-submit form (the pattern the rest of
 * this feature uses) cannot give it without reading the DOM on every render.
 */
export function CreateApplicationModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: CreateApplicationModalProps) {
  const [draft, setDraft] = useState<ApplicationFormValues>(emptyDraft)

  // A fresh blank form each time the dialog opens — including a re-open
  // triggered by the ⌘K shortcut, which sets `isOpen` straight from outside
  // rather than through Base UI's own open/close transitions, so this
  // cannot live in onOpenChange below: that only fires for closes the
  // dialog itself initiates (ESC, backdrop click), never for an externally
  // driven `open` prop flipping true.
  useEffect(() => {
    if (isOpen) setDraft(emptyDraft())
  }, [isOpen])

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  const update = <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>, keepOpen: boolean) => {
    event.preventDefault()
    onSubmit(draft, keepOpen)
    if (keepOpen) setDraft(emptyDraft())
  }

  // ⌘/Ctrl+Enter anywhere in the form submits and keeps the dialog open —
  // the mockup's "⌘ ↵ Сохранить и добавить ещё".
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.currentTarget.requestSubmit()
    }
  }

  const preview = draftToPreview(draft)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid-cols-[1fr_380px] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[1180px]"
        style={{ maxHeight: 'min(860px, 90vh)' }}
      >
        <div className="col-span-2 flex h-14 items-center justify-between border-b border-border px-7">
          <DialogTitle className="font-mono text-[0.65625rem] tracking-[0.09em] text-foreground uppercase">
            New application
          </DialogTitle>
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-[0.65625rem] tracking-[0.09em] text-text-tertiary">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-text-tertiary hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => handleSubmit(event, false)}
          onKeyDown={handleKeyDown}
          noValidate
          className="flex min-h-0 flex-col border-r border-border"
        >
          {/*
           * The field list scrolls on its own; the Save/Cancel footer below
           * sits outside this scroll area so it is always reachable without
           * scrolling — a tall form (many optional fields) must never push
           * its own submit button off-screen.
           */}
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-9 pb-2">
            <h1 className="mb-8 text-[2.75rem] leading-[0.95] tracking-[-0.04em] text-foreground">
              Where did you send it?
            </h1>

            <FormError message={error} />

            <div className="flex flex-col gap-6.5">
              <div className="grid grid-cols-2 gap-6">
                <label className="block">
                  <span className={FIELD_LABEL_CLASSNAME}>Company</span>
                  <input
                    required
                    disabled={isSubmitting}
                    value={draft.company}
                    onChange={(event) => update('company', event.target.value)}
                    placeholder="Acme"
                    className="w-full border-0 border-b border-foreground bg-transparent py-2.5 text-[1.1875rem] text-foreground outline-none placeholder:text-text-tertiary"
                  />
                </label>

                <label className="block">
                  <span className={FIELD_LABEL_CLASSNAME}>Recruiter</span>
                  <input
                    disabled={isSubmitting}
                    value={draft.recruiter}
                    onChange={(event) => update('recruiter', event.target.value)}
                    placeholder="Not specified"
                    className="w-full border-0 border-b border-border bg-transparent py-2.5 text-[1.1875rem] text-foreground outline-none placeholder:text-text-tertiary"
                  />
                </label>
              </div>

              <div>
                <span className="mb-2.5 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase">
                  Priority
                </span>
                <div className="flex">
                  {PRIORITY_LEVELS.map((priority, index) => (
                    <button
                      key={priority}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => update('priority', priority)}
                      className={cn(
                        'flex-1 border py-2.5 font-mono text-[0.625rem] tracking-[0.07em] uppercase',
                        index > 0 && 'border-l-0',
                        draft.priority === priority
                          ? 'border-foreground bg-foreground text-primary-foreground'
                          : 'border-border text-text-secondary',
                      )}
                    >
                      {priorityLabel(priority)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={FIELD_LABEL_CLASSNAME}>Position</span>
                <PositionField
                  required
                  disabled={isSubmitting}
                  value={draft.position}
                  onChange={(value) => update('position', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <label className="block">
                  <span className={FIELD_LABEL_CLASSNAME}>Applied on</span>
                  <input
                    type="date"
                    required
                    min={DATE_INPUT_MIN}
                    max={DATE_INPUT_MAX}
                    disabled={isSubmitting}
                    value={draft.appliedDate}
                    onChange={(event) => update('appliedDate', event.target.value)}
                    className="w-full border-0 border-b border-foreground bg-transparent py-2.5 text-[1.1875rem] text-foreground outline-none"
                  />
                </label>

                <div>
                  <label htmlFor="create-application-work-format" className={FIELD_LABEL_CLASSNAME}>
                    Work format
                  </label>
                  <Select
                    name="workFormat"
                    value={draft.workFormat || UNSPECIFIED_WORK_FORMAT}
                    onValueChange={(value) =>
                      update('workFormat', !value || value === UNSPECIFIED_WORK_FORMAT ? '' : value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="create-application-work-format" className={SELECT_TRIGGER_CLASSNAME}>
                      <SelectValue>{(value: string) => workFormatSelectLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSPECIFIED_WORK_FORMAT}>Not specified</SelectItem>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="ONSITE">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <label className="block">
                  <span className={FIELD_LABEL_CLASSNAME}>Salary, /mo</span>
                  <div className="flex items-baseline gap-2 border-b border-border py-2.5">
                    <span className="text-[1.1875rem] text-text-tertiary">{DEFAULT_CURRENCY_SYMBOL}</span>
                    <input
                      disabled={isSubmitting}
                      value={draft.salary}
                      onChange={(event) => update('salary', sanitizeSalaryDigits(event.target.value))}
                      placeholder="Not specified"
                      inputMode="numeric"
                      className="w-full border-0 bg-transparent p-0 text-[1.1875rem] text-foreground outline-none placeholder:text-text-tertiary"
                    />
                  </div>
                </label>

                <div>
                  <label htmlFor="create-application-salary-type" className={FIELD_LABEL_CLASSNAME}>
                    Salary type
                  </label>
                  <Select
                    name="salaryType"
                    value={draft.salaryType || UNSPECIFIED_SALARY_TYPE}
                    onValueChange={(value) =>
                      update('salaryType', !value || value === UNSPECIFIED_SALARY_TYPE ? '' : value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="create-application-salary-type" className={SELECT_TRIGGER_CLASSNAME}>
                      <SelectValue>{(value: string) => salaryTypeSelectLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSPECIFIED_SALARY_TYPE}>Not specified</SelectItem>
                      <SelectItem value="GROSS">Gross</SelectItem>
                      <SelectItem value="NET">Net</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SourceField
                value={draft.source}
                onChange={(value) => update('source', value)}
                disabled={isSubmitting}
              />

              <div>
                <span className="mb-2.5 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase">
                  Status
                </span>
                <div className="flex">
                  {BOARD_STATUS_ORDER.map((status, index) => (
                    <button
                      key={status}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => update('status', status)}
                      className={cn(
                        'flex-1 border py-2.5 font-mono text-[0.625rem] tracking-[0.07em] uppercase',
                        index > 0 && 'border-l-0',
                        draft.status === status
                          ? 'border-foreground bg-foreground text-primary-foreground'
                          : 'border-border text-text-secondary',
                      )}
                    >
                      {statusLabel(status as ApplicationStatus)}
                    </button>
                  ))}
                </div>
              </div>

              <LabelsField
                labels={draft.labels}
                onChange={(labels) => update('labels', labels)}
                disabled={isSubmitting}
              />

              <label className="block">
                <span className={FIELD_LABEL_CLASSNAME}>Job posting</span>
                <input
                  type="url"
                  disabled={isSubmitting}
                  value={draft.jobUrl}
                  onChange={(event) => update('jobUrl', event.target.value)}
                  placeholder="https://example.com/jobs/1"
                  className="w-full border-0 border-b border-border bg-transparent py-2.5 font-mono text-sm text-text-secondary outline-none placeholder:text-text-tertiary"
                />
              </label>

              <label className="block">
                <span className={FIELD_LABEL_CLASSNAME}>First note</span>
                <textarea
                  disabled={isSubmitting}
                  value={draft.notes}
                  onChange={(event) => update('notes', event.target.value)}
                  placeholder="Write a note…"
                  rows={2}
                  className="w-full resize-none border-0 border-b border-border bg-transparent py-2.5 text-base leading-snug text-foreground outline-none placeholder:text-text-tertiary"
                />
              </label>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4.5 border-t border-border-weak px-8 py-5.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-foreground px-5.5 py-3 font-mono text-[0.65625rem] tracking-[0.08em] text-primary-foreground uppercase disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="font-mono text-[0.65625rem] tracking-[0.08em] text-text-secondary uppercase"
            >
              Cancel
            </button>
            <span className="flex-1" />
            <span className="font-mono text-[0.625rem] text-text-quaternary">
              ⌘ ↵ save and add another
            </span>
          </div>
        </form>

        <div className="min-h-0 overflow-y-auto bg-zebra px-7 py-9">
          <span className="mb-4 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase">
            This is how it lands on the board
          </span>
          <div className="border border-border bg-card">
            <ApplicationCardVisual
              company={draft.company}
              position={draft.position}
              metaTags={applicationCardMetaTags(preview)}
              isOffer={draft.status === 'OFFER'}
              priority={draft.priority}
              className="border-b-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
