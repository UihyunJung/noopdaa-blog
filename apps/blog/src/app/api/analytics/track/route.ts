import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { isBot, parseDeviceType, parseBrowser } from "@/lib/analytics/user-agent";
import { createRateLimiter } from "@/lib/rate-limit";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// DB INSERT 정책의 page_type 허용 목록과 동일하게 유지
const ALLOWED_PAGE_TYPES = new Set(["post", "home", "category", "tag", "about", "page"]);

// IP 기반 rate limiter (분당 30회 — 정상 탐색은 충분, 조회수 인플레이션 억제)
const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

// IP 해시 생성 (개인정보 보호)
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";

    // 봇 필터링
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, skipped: "bot" });
    }

    // IP 추출
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIP || "unknown";

    // Rate limiting (조회수 트리거가 INSERT마다 +1 되므로 반복 호출 억제)
    const { success } = limiter.check(ip);
    if (!success) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { pagePath, pageType, postId, referrer } = body;

    // 필수 필드 검증 (타입 + 길이)
    if (
      !pagePath || typeof pagePath !== "string" || pagePath.length > 500 ||
      !pageType || typeof pageType !== "string" || !ALLOWED_PAGE_TYPES.has(pageType)
    ) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 선택 필드 검증
    if (postId != null && (typeof postId !== "string" || !UUID_REGEX.test(postId))) {
      return NextResponse.json({ success: false, error: "Invalid postId" }, { status: 400 });
    }
    if (referrer != null && typeof referrer !== "string") {
      return NextResponse.json({ success: false, error: "Invalid referrer" }, { status: 400 });
    }

    const ipHash = hashIP(ip);

    // visitor_id: IP 해시 + 한국 날짜 (일별 고유 방문자 계산용)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const visitorId = `${ipHash}_${today}`;

    const supabase = await createServerClient();

    const { error } = await supabase.from("page_views").insert({
      page_path: pagePath,
      page_type: pageType,
      post_id: postId || null,
      visitor_id: visitorId,
      ip_hash: ipHash,
      referrer: referrer ? referrer.slice(0, 1000) : null,
      user_agent: userAgent.slice(0, 500),
      device_type: parseDeviceType(userAgent),
      browser: parseBrowser(userAgent),
    });

    if (error) {
      console.error("Analytics tracking error:", error);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
