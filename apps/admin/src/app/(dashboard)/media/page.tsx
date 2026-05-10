import { createServerClient } from "@/lib/supabase/server";
import type { Media } from "@/lib/types";
import { MediaClient } from "./MediaClient";

export default async function MediaPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Media[] | null };

  return <MediaClient initialMedia={data || []} />;
}
