// 메모리 기반 IP별 rate limiter
// TTL 기반 자동 정리 + 맵 크기 상한

interface RateLimiterOptions {
  windowMs: number; // 시간 윈도우 (ms)
  max: number; // 윈도우 내 최대 요청 수
  maxEntries?: number; // 맵 크기 상한
}

interface RequestRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, maxEntries = 10_000 } = options;
  const requests = new Map<string, RequestRecord>();

  // 만료된 엔트리 정리
  function cleanup() {
    const now = Date.now();
    for (const [key, record] of requests) {
      if (now >= record.resetAt) {
        requests.delete(key);
      }
    }
  }

  return {
    check(key: string): { success: boolean; remaining: number } {
      const now = Date.now();

      // 맵 크기 상한 도달 시 정리
      if (requests.size >= maxEntries) {
        cleanup();
      }

      const record = requests.get(key);

      // 기존 레코드가 없거나 윈도우가 만료된 경우
      if (!record || now >= record.resetAt) {
        requests.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: max - 1 };
      }

      // 윈도우 내 요청
      record.count++;

      if (record.count > max) {
        return { success: false, remaining: 0 };
      }

      return { success: true, remaining: max - record.count };
    },
  };
}
