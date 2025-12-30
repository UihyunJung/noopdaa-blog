import { createServerClient as createClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../database.types";

export async function createServerClient() {
  const cookieStore = await cookies();
  // 프로덕션 환경에서 서브도메인 간 세션 공유를 위한 쿠키 도메인 설정
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = cookieDomain
                ? { ...options, domain: cookieDomain }
                : options;
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  );
}
