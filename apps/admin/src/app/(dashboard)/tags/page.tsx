import { createServerClient } from "@/lib/supabase/server";
import type { Tag } from "@/lib/types";
import { TagsClient } from "./TagsClient";

export default async function TagsPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tags")
    .select("*")
    .order("name") as { data: Tag[] | null };

  return <TagsClient initialTags={data || []} />;
}
