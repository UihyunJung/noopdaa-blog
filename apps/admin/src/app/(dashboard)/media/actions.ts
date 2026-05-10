"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";

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
    const fileExt = file.name.split(".").pop();
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

export async function deleteMedia(id: string, url: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const urlParts = url.split("/");
  const filePath = `uploads/${urlParts[urlParts.length - 1]}`;

  const supabase = await createServerClient();
  await supabase.storage.from("media").remove([filePath]);
  const { error } = await supabase.from("media").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "미디어 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard/media");
  return { ok: true };
}
