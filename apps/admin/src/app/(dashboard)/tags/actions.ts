"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";
import { generateSlug } from "@/lib/utils";

export async function createTag(name: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "이름을 입력해주세요." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("tags").insert({
    name: trimmed,
    slug: generateSlug(trimmed),
  });

  if (error) {
    return { ok: false, error: "태그 추가에 실패했습니다." };
  }

  revalidatePath("/dashboard/tags");
  return { ok: true };
}

export async function updateTag(id: string, name: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "이름을 입력해주세요." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("tags")
    .update({ name: trimmed, slug: generateSlug(trimmed) })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "태그 수정에 실패했습니다." };
  }

  revalidatePath("/dashboard/tags");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "태그 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard/tags");
  return { ok: true };
}
