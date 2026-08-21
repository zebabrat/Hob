/**
 * `min`/`max` for every date input backed by `reasonableDate` on the API
 * side (shared/src/types.ts) — stops the browser's own date picker from
 * ever offering a year the backend would reject, rather than only catching
 * it after a round trip.
 */
export const DATE_INPUT_MIN = '1970-01-01'
export const DATE_INPUT_MAX = '2100-01-01'
export const DATETIME_INPUT_MIN = '1970-01-01T00:00'
export const DATETIME_INPUT_MAX = '2100-01-01T00:00'
