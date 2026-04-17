/**
 * Parse a Ministerio de Hacienda (MH) date string to a Date object.
 *
 * MH responses use format "DD/MM/YYYY HH:mm:ss" for fhProcesamiento.
 * Some endpoints return ISO 8601 — we try that as a fallback.
 *
 * Returns null on null/undefined/empty/unparseable input.
 * Callers must handle null explicitly rather than relying on a `new Date()` fallback,
 * which masked bad data in the previous implementation.
 */
export function parseMhDate(input: string | null | undefined): Date | null {
  if (!input) return null;

  // MH canonical format first — unambiguous, locale-independent
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds] = match;
    const d = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
    );
    if (isNaN(d.getTime())) return null;
    if (
      d.getFullYear() !== parseInt(year) ||
      d.getMonth() !== parseInt(month) - 1 ||
      d.getDate() !== parseInt(day)
    ) {
      return null;
    }
    return d;
  }

  const iso = new Date(input);
  if (!isNaN(iso.getTime())) return iso;

  return null;
}
