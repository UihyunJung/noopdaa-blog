import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// HTML 특수문자 이스케이프 (XSS 방지)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const body = await request.json();
    const { postId, postTitle, authorName, content, isReply } = body;

    // 필수 필드 검증
    if (
      !postId || typeof postId !== "string" ||
      !postTitle || typeof postTitle !== "string" ||
      !authorName || typeof authorName !== "string" ||
      !content || typeof content !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL not configured");
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const postUrl = `${siteUrl}/posts/${postId}`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Blog <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[블로그] 새 ${isReply ? "답글" : "댓글"}: ${escapeHtml(postTitle)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">새 ${isReply ? "답글" : "댓글"}이 등록되었습니다</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>포스트:</strong> ${escapeHtml(postTitle)}</p>
            <p style="margin: 0 0 10px 0;"><strong>작성자:</strong> ${escapeHtml(authorName)}</p>
            <p style="margin: 0;"><strong>내용:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${escapeHtml(content).replace(/\n/g, "<br>")}
            </div>
          </div>

          <a href="${postUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            포스트 보기
          </a>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
