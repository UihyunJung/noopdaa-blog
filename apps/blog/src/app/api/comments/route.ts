import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/rate-limit";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// IP 기반 rate limiter (분당 5회, 댓글 작성 전용)
const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });

// 댓글 목록 조회 + 공개 관리자 프로필
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    // postId UUID 형식 검증
    if (!postId || !UUID_REGEX.test(postId)) {
      return NextResponse.json(
        { error: "Invalid postId" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // 댓글 조회 + 공개 관리자 프로필 병렬 실행
    const [{ data: comments }, { data: adminProfile }] = await Promise.all([
      supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .eq("is_approved", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .limit(1)
        .single(),
    ]);

    return NextResponse.json({
      comments: comments || [],
      adminProfile: adminProfile || null,
    });
  } catch {
    return NextResponse.json({ comments: [], adminProfile: null });
  }
}

// 댓글 작성
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIP || "unknown";

    const { success } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { postId, parentId, authorName, authorEmail, content, isAdmin } = body;

    // 입력값 검증
    if (
      !postId || typeof postId !== "string" ||
      !authorName || typeof authorName !== "string" ||
      !authorEmail || typeof authorEmail !== "string" ||
      !content || typeof content !== "string"
    ) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    if (!UUID_REGEX.test(postId)) {
      return NextResponse.json(
        { error: "잘못된 postId 형식입니다." },
        { status: 400 }
      );
    }

    // 길이 제한 + 빈 문자열 체크
    const trimmedName = authorName.trim();
    const trimmedEmail = authorEmail.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || trimmedName.length > 50) {
      return NextResponse.json({ error: "이름은 1~50자여야 합니다." }, { status: 400 });
    }
    if (!trimmedEmail || trimmedEmail.length > 254) {
      return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (!trimmedContent || trimmedContent.length > 5000) {
      return NextResponse.json({ error: "내용은 1~5000자여야 합니다." }, { status: 400 });
    }

    const supabase = await createServerClient();

    // isAdmin 서버 재검증: 클라이언트가 isAdmin: true를 보내도 서버에서 실제 관리자인지 확인
    let verifiedIsAdmin = false;
    if (isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      verifiedIsAdmin = !!user;
    }

    // 댓글 INSERT
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        parent_id: parentId || null,
        author_name: trimmedName,
        author_email: trimmedEmail,
        content: trimmedContent,
        is_approved: true,
        is_admin: verifiedIsAdmin,
      })
      .select()
      .single();

    if (error) {
      console.error("댓글 작성 오류:", error);
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("댓글 API 오류:", error);
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다." },
      { status: 500 }
    );
  }
}
