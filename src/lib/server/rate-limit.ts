interface RateLimitEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000 // 1 minuto
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = memoryStore.get(key) || { timestamps: [] };

  // Remove timestamps mais antigos que a janela
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxAttempts) {
    const oldest = entry.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  memoryStore.set(key, entry);

  return {
    success: true,
    remaining: maxAttempts - entry.timestamps.length,
    resetMs: windowMs,
  };
}
