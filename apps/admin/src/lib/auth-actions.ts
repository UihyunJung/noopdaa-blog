/**
 * Server Action 공통 유틸 — 인증 가드, 반환 타입 컨벤션
 */
import { createServerClient } from "@/lib/supabase/server";

/**
 * Server Action 반환 타입 표준
 *
 * - 비즈니스 에러(권한 없음, validation 실패): `return { ok: false, error: "..." }`
 * - 예상 못한 시스템 에러: `throw` (error.tsx에서 처리)
 * - 클라이언트는 `if (!result.ok) toast.error(result.error)` 패턴으로 분기
 */
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Server Action 인증 가드.
 *
 * 모든 admin server action 첫 줄에 호출:
 * ```ts
 * "use server";
 * import { requireAuthAction } from "@/lib/auth-actions";
 *
 * export async function createCategory(...) {
 *   const auth = await requireAuthAction();
 *   if (!auth.ok) return auth;
 *   // 인증된 작업 수행
 * }
 * ```
 *
 * 미인증 시 `{ ok: false, error: "인증이 필요합니다." }` 반환.
 */
export async function requireAuthAction(): Promise<ActionResult<{ userId: string }>> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "인증이 필요합니다." };
  }

  return { ok: true, data: { userId: user.id } };
}
