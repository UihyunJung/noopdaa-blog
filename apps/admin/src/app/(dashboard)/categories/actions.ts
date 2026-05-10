"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";
import { generateSlug } from "@/lib/utils";

interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
}

export async function createCategory(
  input: CategoryInput
): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "이름을 입력해주세요." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug: input.slug?.trim() || generateSlug(name),
    description: input.description?.trim() || null,
  });

  if (error) {
    return { ok: false, error: "카테고리 추가에 실패했습니다." };
  }

  revalidatePath("/dashboard/categories");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "이름을 입력해주세요." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug: input.slug?.trim() || generateSlug(name),
      description: input.description?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "카테고리 수정에 실패했습니다." };
  }

  revalidatePath("/dashboard/categories");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "카테고리 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard/categories");
  return { ok: true };
}
