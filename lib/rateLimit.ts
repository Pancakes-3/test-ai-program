type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitRecord>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = store.get(key);
  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  record.count += 1;
  store.set(key, record);
  return { allowed: true, remaining: limit - record.count };
}
