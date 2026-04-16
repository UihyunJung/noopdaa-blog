import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/rate-limit";

// IP 기반 rate limiter (분당 10회)
const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function GET() {
  try {
    // Rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIP || "unknown";

    const { success } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { isAdmin: false, profile: null },
        { status: 429 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ isAdmin: false, profile: null });
    }

    // 관리자 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      isAdmin: true,
      profile: {
        username: profile?.username || "관리자",
        email: user.email || "",
        avatar_url: profile?.avatar_url || null,
      },
    });
  } catch {
    return NextResponse.json({ isAdmin: false, profile: null });
  }
}
