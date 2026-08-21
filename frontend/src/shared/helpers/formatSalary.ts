/**
 * The one currency every salary in the app is quoted in. There is no
 * currency field on the application — see the Prisma schema comment — so
 * this is a fixed display preset rather than a per-application value.
 */
export const DEFAULT_CURRENCY_SYMBOL = '$'

/**
 * 180000 becomes "180 000".
 *
 * Grouped by hand rather than with toLocaleString: the separator that produces
 * depends on the locale and on the ICU build behind it, so the same number can
 * come out as "180,000" in a test runner and "180 000" in a browser. The board
 * wants one shape everywhere.
 */
export function formatSalary(salary: number | null): string | null {
  if (salary === null) return null

  return String(salary).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
