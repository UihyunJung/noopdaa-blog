import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * slug 유효성 검사
 * - 소문자 영숫자 + 하이픈만 허용
 * - 하이픈으로 시작/종료 불가
 * - 최소 2자, 최대 100자
 * - UUID 형태 차단
 */
export function isValidSlug(slug: string): boolean {
  // 길이 체크: 2~100자
  if (slug.length < 2 || slug.length > 100) return false;

  // 정규식: 소문자 영숫자로 시작, 소문자 영숫자로 종료, 중간에 하이픈 허용
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) return false;

  // UUID 형태 차단 (8-4-4-4-12 hex digits)
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug
    )
  ) {
    return false;
  }

  return true;
}

/**
 * slug 중복 확인 및 중복 시 자동 증가 숫자 추가
 * @param supabase - Supabase 클라이언트
 * @param slug - 원본 slug
 * @param excludePostId - 제외할 포스트 ID (수정 시 현재 포스트 자신과의 비교 방지)
 * @returns 유니크한 slug (필요시 -2, -3 등 추가)
 */
export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  slug: string,
  excludePostId?: string
): Promise<string> {
  let candidate = slug;
  let suffix = 2;

  // 최대 100번 시도 (slug-2, slug-3, ... slug-101)
  while (suffix <= 101) {
    let query = supabase.from("posts").select("id").eq("slug", candidate).limit(1);

    if (excludePostId) {
      query = query.neq("id", excludePostId);
    }

    const { data, error } = await query.maybeSingle();

    // 에러 발생 시 예외 처리 (RLS 정책 등)
    if (error) {
      throw new Error(`slug 중복 확인 중 오류: ${error.message}`);
    }

    // 해당 slug가 없으면 반환
    if (!data) {
      return candidate;
    }

    // 중복이면 다음 후보 시도
    candidate = `${slug}-${suffix}`;
    suffix++;
  }

  // 100번 이상 중복된 경우 (극히 드문 경우)
  throw new Error("유니크한 slug를 생성할 수 없습니다.");
}
