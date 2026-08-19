import type { ApplicationDto, ApplicationStatus } from '@hob/shared'

/** One column of the board: a status, its heading, and the cards in it. */
export interface ApplicationColumn {
  status: ApplicationStatus
  title: string
  applications: ApplicationDto[]
}

/**
 * The create form as the browser hands it over: every field a string, including
 * the ones that end up as a number or a date. Turning them into the API payload
 * is the job of helpers/formValues.
 */
export interface ApplicationFormValues {
  company: string
  position: string
  appliedDate: string
  salary: string
  workFormat: string
  jobUrl: string
}

/**
 * The detail page's edit form. A superset of the create form — status,
 * summary and notes are set once the application exists, not at creation —
 * kept as its own type because the two forms are free to diverge further:
 * the edit form clears a blank optional field, the create form omits it.
 */
export interface ApplicationEditFormValues {
  company: string
  position: string
  status: ApplicationStatus
  appliedDate: string
  salary: string
  workFormat: string
  jobUrl: string
  summary: string
  notes: string
}

/** The interview round form, add and edit alike. */
export interface InterviewFormValues {
  round: string
  scheduledAt: string
  notes: string
}
