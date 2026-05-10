import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // dashboard layout이 이미 인증 가드 — 이건 defense-in-depth
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 프로필 미존재 케이스 (이론상 없어야 하나 방어)
  if (!profile) {
    redirect("/login");
  }

  return <ProfileClient profile={profile} />;
}
