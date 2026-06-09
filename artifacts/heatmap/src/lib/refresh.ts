/** UTC calendar day (YYYY-MM-DD) used as the daily refresh boundary. */
export function getRefreshDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isCacheValidForToday(cachedAt: number, refreshDay?: string): boolean {
  const day = refreshDay ?? getRefreshDay(new Date(cachedAt));
  return day === getRefreshDay();
}
