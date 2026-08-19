import type {
  ApplicationCreateInput,
  ApplicationDto,
  ApplicationStatus,
  ApplicationUpdateInput,
  InterviewCreateInput,
  InterviewDto,
  InterviewUpdateInput,
  WorkFormat,
} from '@hob/shared'
import { workFormatLabel } from 'shared/helpers/labels'
import { toDateTimeLocalValue } from './dateTimeLocal'
import type { ApplicationEditFormValues, ApplicationFormValues, InterviewFormValues } from '../types'

function readField(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * shadcn's Select (Base UI underneath) is not a native <select> — an empty
 * string as an item's value is a known footgun in this family of components
 * (Radix's own Select refuses it outright), so "not specified" is a real,
 * non-empty sentinel value in the dropdown rather than "". Every other part
 * of this feature still only ever sees '' for "not specified" — this is
 * translated back to that the moment the form is read.
 */
export const UNSPECIFIED_WORK_FORMAT = '__unspecified__'

function readWorkFormat(form: HTMLFormElement): string {
  const value = readField(form, 'workFormat')
  return value === UNSPECIFIED_WORK_FORMAT ? '' : value
}

/**
 * The label a work-format Select's trigger shows for whatever value it
 * currently holds, sentinel included. Needed because this installed version
 * of Base UI's SelectValue does not resolve a selected item's label on its
 * own — it falls back to printing the raw value verbatim (so the sentinel
 * shows as the literal string "__unspecified__") unless something maps the
 * value to a label explicitly. Passed to SelectValue's children render-prop
 * at every work-format Select in this feature, so the fix lives once.
 */
export function workFormatSelectLabel(value: string): string {
  if (value === UNSPECIFIED_WORK_FORMAT || value === '') return 'Not specified'
  return workFormatLabel(value as WorkFormat) ?? value
}

export function readApplicationValues(form: HTMLFormElement): ApplicationFormValues {
  return {
    company: readField(form, 'company'),
    position: readField(form, 'position'),
    appliedDate: readField(form, 'appliedDate'),
    salary: readField(form, 'salary'),
    workFormat: readWorkFormat(form),
    jobUrl: readField(form, 'jobUrl'),
  }
}

/**
 * Form strings to the shape the API takes.
 *
 * The optional fields are left out entirely when blank rather than sent as
 * empty strings: the contract rejects an empty jobUrl as an invalid URL, and an
 * absent key is what "not filled in" means there.
 */
export function toCreateInput(values: ApplicationFormValues): ApplicationCreateInput {
  return {
    company: values.company,
    position: values.position,
    // A date input gives YYYY-MM-DD; the contract coerces it to a date.
    appliedDate: new Date(values.appliedDate),
    ...(values.salary ? { salary: Number(values.salary) } : {}),
    ...(values.workFormat ? { workFormat: values.workFormat as WorkFormat } : {}),
    ...(values.jobUrl ? { jobUrl: values.jobUrl } : {}),
  }
}

/** The detail form's starting values: the saved application, one field at a time. */
export function applicationToEditValues(application: ApplicationDto): ApplicationEditFormValues {
  return {
    company: application.company,
    position: application.position,
    status: application.status,
    // ISO timestamp to what a date input expects; the time-of-day carried in
    // appliedDate is never shown, so truncating it loses nothing.
    appliedDate: application.appliedDate.slice(0, 10),
    salary: application.salary === null ? '' : String(application.salary),
    workFormat: application.workFormat ?? '',
    jobUrl: application.jobUrl ?? '',
    summary: application.summary ?? '',
    notes: application.notes ?? '',
  }
}

export function readApplicationEditValues(form: HTMLFormElement): ApplicationEditFormValues {
  return {
    company: readField(form, 'company'),
    position: readField(form, 'position'),
    status: readField(form, 'status') as ApplicationStatus,
    appliedDate: readField(form, 'appliedDate'),
    salary: readField(form, 'salary'),
    workFormat: readWorkFormat(form),
    jobUrl: readField(form, 'jobUrl'),
    summary: readField(form, 'summary'),
    notes: readField(form, 'notes'),
  }
}

/**
 * The whole edit form to one PATCH body.
 *
 * Every field travels on every save, not only the ones the user touched — a
 * native form has no built-in notion of "touched", and diffing would need
 * controlled state for fields that are otherwise plain and uncontrolled. A
 * blank optional field is sent as null, which clears it: that is what leaving
 * it empty and pressing Save is understood to mean here.
 */
export function toApplicationUpdateInput(values: ApplicationEditFormValues): ApplicationUpdateInput {
  return {
    company: values.company,
    position: values.position,
    status: values.status,
    appliedDate: new Date(values.appliedDate),
    salary: values.salary ? Number(values.salary) : null,
    workFormat: values.workFormat ? (values.workFormat as WorkFormat) : null,
    jobUrl: values.jobUrl || null,
    summary: values.summary || null,
    notes: values.notes || null,
  }
}

export function readInterviewValues(form: HTMLFormElement): InterviewFormValues {
  return {
    round: readField(form, 'round'),
    scheduledAt: readField(form, 'scheduledAt'),
    notes: readField(form, 'notes'),
  }
}

/** An existing round's starting values, for the form InterviewList swaps in to edit it. */
export function interviewToFormValues(interview: InterviewDto): InterviewFormValues {
  return {
    round: interview.round,
    scheduledAt: interview.scheduledAt ? toDateTimeLocalValue(interview.scheduledAt) : '',
    notes: interview.notes ?? '',
  }
}

/** Blank optional fields are left out — matches how a new application is created. */
export function toInterviewCreateInput(values: InterviewFormValues): InterviewCreateInput {
  return {
    round: values.round,
    ...(values.scheduledAt ? { scheduledAt: new Date(values.scheduledAt) } : {}),
    ...(values.notes ? { notes: values.notes } : {}),
  }
}

/** Editing a round follows the application edit form's rule: blank clears. */
export function toInterviewUpdateInput(values: InterviewFormValues): InterviewUpdateInput {
  return {
    round: values.round,
    scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : null,
    notes: values.notes || null,
  }
}
