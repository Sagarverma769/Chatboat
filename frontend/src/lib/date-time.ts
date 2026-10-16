export function formatLocalDateTime(
  value: string | null | undefined,
  locale = "en-IN",
): string {
  if (!value) return "Unknown";

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const timestamp = new Date(hasTimezone ? value : `${value}Z`);
  if (Number.isNaN(timestamp.getTime())) return "Unknown";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}
