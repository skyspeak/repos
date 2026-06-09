import { getRefreshDay, isCacheValidForToday } from "./refresh";

export interface DeepDiveCacheEntry {
  output: string;
  cachedAt: number;
  refreshDay: string;
}

const cache = new Map<string, DeepDiveCacheEntry>();

export function getDeepDiveCache(
  cacheKey: string,
): DeepDiveCacheEntry | null {
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  if (!isCacheValidForToday(entry.cachedAt, entry.refreshDay)) {
    cache.delete(cacheKey);
    return null;
  }
  return entry;
}

export function setDeepDiveCache(cacheKey: string, output: string): void {
  cache.set(cacheKey, {
    output,
    cachedAt: Date.now(),
    refreshDay: getRefreshDay(),
  });
}

export function clearDeepDiveCache(): number {
  const count = cache.size;
  cache.clear();
  return count;
}
