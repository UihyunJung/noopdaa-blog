"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";

// 이미지 전용 allowlist (SVG는 스크립트 포함 가능하므로 제외)
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);

export async function uploadMedia(
  formData: FormData
): Promise<ActionResult<{ uploaded: number; failed: string[] }>> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { ok: false, error: "업로드할 파일이 없습니다." };
  }

  const supabase = await createServerClient();
  let uploaded = 0;
  const failed: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";

    // 서버 측 타입/확장자 검증 (클라이언트 accept 속성은 우회 가능)
    if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(fileExt)) {
      failed.push(file.name);
      continue;
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) {
      failed.push(file.name);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("media").insert({
      filename: file.name,
      url: publicUrl,
      type: file.type,
      size: file.size,
    });

    if (insertError) {
      // 메타데이터 insert 실패 시 storage 파일도 정리
      await supabase.storage.from("media").remove([filePath]);
      failed.push(file.name);
      continue;
    }

    uploaded++;
  }

  revalidatePath("/dashboard/media");
  return { ok: true, data: { uploaded, failed } };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();

  // 클라이언트가 보낸 url 대신 DB 레코드 기준으로 storage 경로 결정
  const { data: item } = await supabase
    .from("media")
    .select("url")
    .eq("id", id)
    .maybeSingle();

  if (!item) {
    return { ok: false, error: "미디어를 찾을 수 없습니다." };
  }

  const filePath = `uploads/${item.url.split("/").pop()}`;
  await supabase.storage.from("media").remove([filePath]);
  const { error } = await supabase.from("media").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "미디어 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard/media");
  return { ok: true };
}
