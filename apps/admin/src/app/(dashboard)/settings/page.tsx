import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SettingsClient, type SiteSettings, type Post } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createServerClient();

  const [settingsRes, postsRes] = await Promise.all([
    supabase.from("site_settings").select("*").single() as unknown as Promise<{ data: SiteSettings | null }>,
    supabase
      .from("posts")
      .select("id, title, thumbnail_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }) as unknown as Promise<{ data: Post[] | null }>,
  ]);

  if (!settingsRes.data) {
    notFound();
  }

  return <SettingsClient settings={settingsRes.data} allPosts={postsRes.data || []} />;
}
