"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";

export async function updateUsername(username: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const trimmed = username.trim();
  if (!trimmed) {
    return { ok: false, error: "닉네임을 입력해주세요." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmed })
    .eq("id", auth.data!.userId);

  if (error) {
    return { ok: false, error: "닉네임 저장에 실패했습니다." };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}

export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "파일을 선택해주세요." };
  }

  const userId = auth.data!.userId;
  const supabase = await createServerClient();

  // 기존 avatar 정리
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (profile?.avatar_url) {
    const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);
  }

  // 신규 업로드
  const fileExt = file.name.split(".").pop();
  const filePath = `avatars/avatar-${userId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(filePath, file);

  if (uploadError) {
    return { ok: false, error: "아바타 업로드에 실패했습니다." };
  }

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    return { ok: false, error: "프로필 업데이트에 실패했습니다." };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}

export async function removeAvatar(): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const userId = auth.data!.userId;
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (profile?.avatar_url) {
    const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: "아바타 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}
