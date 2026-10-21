export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

export function dayLabel(at: Date): string {
  return at.toISOString().slice(0, 10);
}

export function fillDays(
  since: Date,
  days: number,
  counts: Map<string, number>,
): Array<{ day: string; groups: number }> {
  const series: Array<{ day: string; groups: number }> = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = dayLabel(new Date(since.getTime() + offset * DAY_MS));
    series.push({ day, groups: counts.get(day) ?? 0 });
  }
  return series;
}
