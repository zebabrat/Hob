import { useState } from 'react'
import type { FormEvent } from 'react'
import { APPLICATION_STATUSES, PRIORITY_LEVELS } from '@hob/shared'
import type { ApplicationDto, ApplicationStatus, Priority } from '@hob/shared'
import { DATE_INPUT_MAX, DATE_INPUT_MIN } from 'shared/helpers/dateBounds'
import { DEFAULT_CURRENCY_SYMBOL } from 'shared/helpers/formatSalary'
import { priorityLabel, statusLabel, workFormatLabel } from 'shared/helpers/labels'
import { FormError } from 'shared/components/FormError'
import { SubmitButton } from 'shared/components/SubmitButton'
import { TextField } from 'shared/components/TextField'
import { Label } from 'shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'shared/components/ui/select'
import {
  UNSPECIFIED_SALARY_TYPE,
  UNSPECIFIED_WORK_FORMAT,
  readApplicationEditValues,
  salaryTypeSelectLabel,
  sanitizeSalaryDigits,
  workFormatSelectLabel,
} from '../helpers/formValues'
import type { ApplicationEditFormValues } from '../types'
import { PositionField } from './PositionField'
import { SourceField } from './SourceField'
import { TextAreaField } from './TextAreaField'

interface ApplicationEditFormProps {
  application: ApplicationDto
  editValues: ApplicationEditFormValues
  isSubmitting: boolean
  error: string | null
  onSave: (values: ApplicationEditFormValues) => void
}

/**
 * The detail page's "Edit details" form. Split out of ApplicationDetail so
 * Position and Source — combobox/multiselect components with their own
 * local React state, unlike the rest of this otherwise-uncontrolled form —
 * get a component instance to hold that state in. The parent remounts this
 * (via `key={application.updatedAt}`) after every successful save, which is
 * what resets that local state back to the newly-saved values instead of
 * needing a manual effect.
 */
export function ApplicationEditForm({
  application,
  editValues,
  isSubmitting,
  error,
  onSave,
}: ApplicationEditFormProps) {
  const [position, setPosition] = useState(editValues.position)
  const [source, setSource] = useState(editValues.source)

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(
      readApplicationEditValues(event.currentTarget, {
        labels: editValues.labels,
        position,
        source,
      }),
    )
  }

  return (
    <details className="group border-t border-border-weak pt-4">
      <summary className="cursor-pointer font-mono text-[0.625rem] tracking-[0.09em] text-text-secondary uppercase hover:text-foreground">
        Edit details
      </summary>

      <form onSubmit={handleSave} noValidate className="mt-5 flex flex-col gap-4">
        <FormError message={error} />

        <TextField
          label="Company"
          name="company"
          defaultValue={editValues.company}
          required
          disabled={isSubmitting}
        />

        <TextField
          label="Recruiter"
          name="recruiter"
          defaultValue={editValues.recruiter}
          hint="Optional — who you actually talked to there"
          disabled={isSubmitting}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-position">Position</Label>
          <PositionField
            id="application-position"
            value={position}
            onChange={setPosition}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-status">Status</Label>
          <Select name="status" defaultValue={editValues.status} disabled={isSubmitting}>
            <SelectTrigger id="application-status" className="w-full">
              <SelectValue>{(value: ApplicationStatus) => statusLabel(value)}</SelectValue>
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-priority">Priority</Label>
          <Select name="priority" defaultValue={editValues.priority} disabled={isSubmitting}>
            <SelectTrigger id="application-priority" className="w-full">
              <SelectValue>{(value: Priority) => priorityLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_LEVELS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priorityLabel(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TextField
          label="Applied on"
          name="appliedDate"
          type="date"
          min={DATE_INPUT_MIN}
          max={DATE_INPUT_MAX}
          defaultValue={editValues.appliedDate}
          required
          disabled={isSubmitting}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-salary">Salary, /mo</Label>
          <div className="flex items-baseline gap-2 border-b border-border py-1.5">
            <span className="text-text-tertiary">{DEFAULT_CURRENCY_SYMBOL}</span>
            <input
              id="application-salary"
              name="salary"
              type="text"
              inputMode="numeric"
              defaultValue={editValues.salary}
              disabled={isSubmitting}
              placeholder="Not specified"
              onChange={(event) => {
                event.target.value = sanitizeSalaryDigits(event.target.value)
              }}
              className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-text-tertiary"
            />
          </div>
          <Select
            name="salaryType"
            defaultValue={editValues.salaryType || UNSPECIFIED_SALARY_TYPE}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => salaryTypeSelectLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSPECIFIED_SALARY_TYPE}>Not specified</SelectItem>
              <SelectItem value="GROSS">Gross</SelectItem>
              <SelectItem value="NET">Net</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-work-format">Work format</Label>
          <Select
            name="workFormat"
            defaultValue={editValues.workFormat || UNSPECIFIED_WORK_FORMAT}
            disabled={isSubmitting}
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

        <SourceField value={source} onChange={setSource} disabled={isSubmitting} />

        <TextField
          label="Offer reply deadline"
          name="offerDeadline"
          type="date"
          min={DATE_INPUT_MIN}
          max={DATE_INPUT_MAX}
          defaultValue={editValues.offerDeadline}
          hint="Optional — only shown while the status is Offer"
          disabled={isSubmitting}
        />

        <div>
          <TextField
            label="Job posting"
            name="jobUrl"
            type="url"
            defaultValue={editValues.jobUrl}
            hint="Optional"
            disabled={isSubmitting}
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
          disabled={isSubmitting}
        />

        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Saving…">
          Save
        </SubmitButton>
      </form>
    </details>
  )
}
