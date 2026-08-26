"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";

// 브라우저용 Supabase 클라이언트 생성 유틸.
// 관리자 로그인/로그아웃(/login)에서 사용한다. 댓글 조회·작성은 서버 API를 거치므로
// 이 클라이언트를 쓰지 않는다.
//
// NEXT_PUBLIC_COOKIE_DOMAIN이 비어 있으면 접속 중인 호스트 전용 쿠키로 저장된다.
// 값이 현재 호스트와 맞지 않으면 브라우저가 쿠키를 조용히 버리므로,
// 서브도메인 간 세션 공유가 실제로 필요할 때만 설정한다.
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
