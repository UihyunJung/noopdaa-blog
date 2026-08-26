"use client";

export interface AuthCheckResult {
  isAdmin: boolean;
  profile: {
    username: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

const FALLBACK: AuthCheckResult = { isAdmin: false, profile: null };

// 같은 페이지 로드 안에서 Header와 Comments가 각각 호출하지 않도록 요청을 공유한다.
// /api/auth/check에는 IP 기준 rate limit(분당 10회)이 걸려 있어, 중복 호출을 두면
// 방문자가 포스트를 빠르게 넘길 때 429에 걸린다.
// 로그인/로그아웃 후에는 전체 페이지를 새로 로드하므로 이 캐시도 함께 초기화된다.
let pending: Promise<AuthCheckResult> | null = null;

/**
 * 관리자 로그인 여부 조회.
 * @param force true면 캐시를 무시하고 다시 조회한다 (로그인 직후 재확인용).
 */
export function fetchAuthCheck(force = false): Promise<AuthCheckResult> {
  if (force || !pending) {
    pending = fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => ({
        isAdmin: !!data?.isAdmin,
        profile: data?.profile ?? null,
      }))
      .catch(() => FALLBACK);
  }
  return pending;
}
