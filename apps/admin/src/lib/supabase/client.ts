"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";

export function createClient() {
  // 프로덕션 환경에서 서브도메인 간 세션 공유를 위한 쿠키 도메인 설정
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain
      ? {
          cookieOptions: {
            domain: cookieDomain,
          },
        }
      : undefined
  );
}
