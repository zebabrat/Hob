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
