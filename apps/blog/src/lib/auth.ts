import type { User } from "@supabase/supabase-js";

/**
 * 관리자 여부 판정.
 *
 * 로그인 사실만으로는 관리자가 아니다. `ADMIN_EMAIL`과 일치하는 계정만 관리자로 인정한다.
 * Supabase anon key는 설계상 공개 값이므로, "세션이 있으면 관리자"로 두면
 * 계정을 만들 수 있는 누구나 관리자 배지를 달 수 있게 된다.
 *
 * `ADMIN_EMAIL`이 설정되지 않으면 항상 false를 반환한다 (fail-closed).
 * 서버 전용 변수이므로 클라이언트 번들에 노출되지 않는다.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !user?.email) return false;
  return user.email.trim().toLowerCase() === adminEmail;
}
