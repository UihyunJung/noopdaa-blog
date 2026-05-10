"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthAction, type ActionResult } from "@/lib/auth-actions";

export async function approveComment(id: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("comments")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "댓글 승인에 실패했습니다." };
  }

  revalidatePath("/dashboard/comments");
  return { ok: true };
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const auth = await requireAuthAction();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "댓글 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard/comments");
  return { ok: true };
}
