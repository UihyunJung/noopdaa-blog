import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Groq API로 프롬프트 생성 (무료)
async function generatePromptFromContent(content: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `다음 블로그 글의 내용을 분석하고, 이 글의 썸네일 이미지로 적합한 이미지 생성 프롬프트를 영어로 작성해주세요.
프롬프트는 간결하고 시각적으로 매력적인 이미지를 생성할 수 있어야 합니다.
텍스트나 글자는 포함하지 마세요. 순수하게 시각적 요소만 포함해주세요.
프롬프트만 출력하세요. 다른 설명은 필요없습니다.

블로그 글 내용:
${content.slice(0, 2000)}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error("프롬프트 생성에 실패했습니다.");
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("프롬프트 생성에 실패했습니다.");
  }

  return text;
}

// Pollinations.ai로 이미지 생성 (무료, API 키 불필요)
async function generateImage(prompt: string): Promise<Buffer> {
  const encodedPrompt = encodeURIComponent(
    `Blog thumbnail, professional clean design, no text: ${prompt}`
  );

  // Pollinations.ai 무료 API (16:9 비율)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1792&height=1024&nologo=true`;

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("이미지 생성에 실패했습니다.");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "글 내용이 필요합니다." },
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

    // 1. 콘텐츠에서 이미지 프롬프트 생성
    const imagePrompt = await generatePromptFromContent(content);

    // 2. DALL-E로 이미지 생성
    const imageBuffer = await generateImage(imagePrompt);

    // 3. Supabase Storage에 업로드
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
      });

    if (uploadError) {
      throw new Error("이미지 업로드에 실패했습니다.");
    }

    // 4. Public URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    // 5. 미디어 테이블에 등록
    await supabase.from("media").insert({
      filename: `AI Generated - ${fileName}`,
      url: publicUrl,
      type: "image/png",
      size: imageBuffer.length,
    });

    return NextResponse.json({ url: publicUrl, prompt: imagePrompt });
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "이미지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
