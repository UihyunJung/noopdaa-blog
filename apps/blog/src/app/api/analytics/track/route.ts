import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { isBot, parseDeviceType, parseBrowser } from "@/lib/analytics/user-agent";

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

    const body = await request.json();
    const { pagePath, pageType, postId, referrer } = body;

    // 필수 필드 검증
    if (!pagePath || !pageType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // IP 추출 및 해시
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIP || "unknown";
    const ipHash = hashIP(ip);

    // visitor_id: IP 해시 + 날짜 (일별 고유 방문자 계산용)
    const today = new Date().toISOString().split("T")[0];
    const visitorId = `${ipHash}_${today}`;

    const supabase = await createServerClient();

    const { error } = await supabase.from("page_views").insert({
      page_path: pagePath,
      page_type: pageType,
      post_id: postId || null,
      visitor_id: visitorId,
      ip_hash: ipHash,
      referrer: referrer || null,
      user_agent: userAgent,
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
