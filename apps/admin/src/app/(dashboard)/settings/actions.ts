"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";

type ImageType = "hero" | "og";

interface SiteInfoInput {
  siteName: string;
  siteDescription: string;
  siteIntro: string;
}

async function getSettingsId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("site_settings").select("id").single();
  return data?.id ?? null;
}

export async function updateSiteInfo(input: SiteInfoInput): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const siteName = input.siteName.trim();
  if (!siteName) return { ok: false, error: "블로그명을 입력해주세요." };

  const settingsId = await getSettingsId();
  if (!settingsId) return { ok: false, error: "설정을 찾을 수 없습니다." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      site_name: siteName,
      site_description: input.siteDescription.trim() || null,
      site_intro: input.siteIntro.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settingsId);

  if (error) return { ok: false, error: "설정 저장에 실패했습니다." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function uploadSiteImage(
  type: ImageType,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "파일을 선택해주세요." };

  const settingsId = await getSettingsId();
  if (!settingsId) return { ok: false, error: "설정을 찾을 수 없습니다." };

  const supabase = await createServerClient();
  const fieldName = type === "hero" ? "hero_image_url" : "og_image_url";

  // 기존 이미지 정리
  const { data: current } = await supabase
    .from("site_settings")
    .select(fieldName)
    .eq("id", settingsId)
    .single() as { data: Record<string, string | null> | null };

  const oldUrl = current?.[fieldName];
  if (oldUrl) {
    const oldPath = oldUrl.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);
  }

  // 신규 업로드
  const fileExt = file.name.split(".").pop();
  const filePath = `site/${type}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(filePath, file);

  if (uploadError) return { ok: false, error: "이미지 업로드에 실패했습니다." };

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("site_settings")
    .update({
      [fieldName]: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settingsId);

  if (updateError) return { ok: false, error: "설정 업데이트에 실패했습니다." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeSiteImage(type: ImageType): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const settingsId = await getSettingsId();
  if (!settingsId) return { ok: false, error: "설정을 찾을 수 없습니다." };

  const supabase = await createServerClient();
  const fieldName = type === "hero" ? "hero_image_url" : "og_image_url";

  const { data: current } = await supabase
    .from("site_settings")
    .select(fieldName)
    .eq("id", settingsId)
    .single() as { data: Record<string, string | null> | null };

  const url = current?.[fieldName];
  if (url) {
    const oldPath = url.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      [fieldName]: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settingsId);

  if (error) return { ok: false, error: "이미지 삭제에 실패했습니다." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateHeroPosts(postIds: string[]): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  if (postIds.length > 3) {
    return { ok: false, error: "최대 3개까지 선택할 수 있습니다." };
  }

  const settingsId = await getSettingsId();
  if (!settingsId) return { ok: false, error: "설정을 찾을 수 없습니다." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_post_ids: postIds.length > 0 ? postIds : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settingsId);

  if (error) return { ok: false, error: "추천 글 저장에 실패했습니다." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
