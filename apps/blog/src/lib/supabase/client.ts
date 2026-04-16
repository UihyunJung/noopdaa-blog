"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";

// 브라우저용 Supabase 클라이언트 생성 유틸.
// Comments 리팩터링(서버 API 전환) 후 현재 blog에서 미사용 상태이지만,
// 향후 클라이언트 Supabase가 필요한 기능 추가 시 재사용 가능하므로 유지.
export function createClient() {
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
