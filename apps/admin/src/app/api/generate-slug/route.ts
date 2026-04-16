import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/slug-utils";

/**
 * Gemini API를 사용하여 한국어 제목으로부터 SEO 친화적인 영문 slug 3개 제안
 */
async function generateSlugsWithGemini(title: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
    throw new Error("API key not configured");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          slugs: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["slugs"],
      },
    },
  });

  const prompt = `다음 한국어 제목을 SEO 친화적인 영문 slug 3개로 변환하라.
각 slug는 다음 규칙을 따라야 한다:
- 소문자 영문자와 숫자만 사용
- 단어는 하이픈(-)으로 구분
- 3~6개 단어
- 핵심 키워드 중심
- URL-safe (특수문자 불포함)

제목: ${title}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Gemini API 응답 파싱 실패:", text);
    throw new Error("Gemini API 응답을 파싱할 수 없습니다.");
  }

  if (!Array.isArray(parsed.slugs) || parsed.slugs.length === 0) {
    throw new Error("Gemini API 응답에 slug 배열이 없습니다.");
  }

  // slug 유효성 재검증 및 불량 항목 제외
  const validSlugs = parsed.slugs
    .filter((slug: string) => typeof slug === "string" && isValidSlug(slug))
    .slice(0, 3);

  if (validSlugs.length === 0) {
    throw new Error("생성된 slug 중 유효한 항목이 없습니다.");
  }

  return validSlugs;
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    // 입력 검증
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "제목이 필요합니다." },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 200) {
      return NextResponse.json(
        { error: "제목은 1~200자 사이여야 합니다." },
        { status: 400 }
      );
    }

    // 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // slug 생성
    const slugs = await generateSlugsWithGemini(trimmedTitle);

    return NextResponse.json({ slugs }, { status: 200 });
  } catch (error) {
    console.error("slug 생성 오류:", error);

    // 클라이언트에는 일반적인 에러 메시지만 반환 (상세는 서버 로그에만)
    if (error instanceof Error && error.message === "API key not configured") {
      // API 키 미설정은 500으로 반환하되, 로그에만 상세 기록
      return NextResponse.json(
        { error: "slug 생성 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "slug 생성 실패" },
      { status: 500 }
    );
  }
}
