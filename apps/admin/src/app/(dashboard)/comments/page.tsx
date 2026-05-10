import { createServerClient } from "@/lib/supabase/server";
import { CommentsClient, type CommentWithPost, type CommentsFilter } from "./CommentsClient";

interface CommentsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

const VALID_FILTERS: CommentsFilter[] = ["all", "pending", "approved"];

export default async function CommentsPage({ searchParams }: CommentsPageProps) {
  const params = await searchParams;
  const filter: CommentsFilter = VALID_FILTERS.includes(params.filter as CommentsFilter)
    ? (params.filter as CommentsFilter)
    : "all";

  const supabase = await createServerClient();
  let query = supabase
    .from("comments")
    .select("*, posts(title)")
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("is_approved", false);
  } else if (filter === "approved") {
    query = query.eq("is_approved", true);
  }

  const { data } = await query as { data: CommentWithPost[] | null };

  return <CommentsClient initialComments={data || []} filter={filter} />;
}
