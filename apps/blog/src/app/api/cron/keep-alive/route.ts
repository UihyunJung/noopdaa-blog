import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

// 캐시되면 DB에 닿지 않아 keep-alive의 목적을 잃는다
export const dynamic = "force-dynamic";

/**
 * Supabase 무료 플랜 자동 일시정지 방지용 keep-alive.
 *
 * 무료 플랜은 7일간 활동이 없으면 프로젝트를 자동으로 일시정지한다.
 * 유입이 적은 기간에도 하루 1회 가벼운 쿼리를 보내 활동 기록을 남긴다.
 * 스케줄은 apps/blog/vercel.json의 crons 참고.
 */
export async function GET() {
  // CRON_SECRET 미설정 시 항상 거부 (fail-closed).
  // Vercel Cron은 이 값이 설정돼 있을 때만 Authorization 헤더를 붙여 호출하므로,
  // 미설정 상태로 열어두면 누구나 호출할 수 있는 엔드포인트가 된다.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[keep-alive] CRON_SECRET이 설정되지 않았습니다");
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 500 });
  }

  const headersList = await headers();
  if (headersList.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();

  // head: true — 행은 받지 않고 count만 받는다. 활동 기록에는 이 정도로 충분
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[keep-alive] Supabase 쿼리 실패:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count, at: new Date().toISOString() });
}
