/** UTC calendar day (YYYY-MM-DD) used as the daily refresh boundary. */
export function getRefreshDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function startOfRefreshDay(date = new Date()): Date {
  const day = getRefreshDay(date);
  return new Date(`${day}T00:00:00.000Z`);
}

export function isCacheValidForToday(cachedAt: number, refreshDay?: string): boolean {
  const day = refreshDay ?? getRefreshDay(new Date(cachedAt));
  return day === getRefreshDay();
}
