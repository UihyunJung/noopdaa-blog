import Link from "next/link";
import { Button } from "@noopdaa/ui";
import { createServerClient } from "@/lib/supabase/server";
import { PostsTable } from "./PostsTable";

interface PostsPageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status || "all";
  const perPage = 10;

  const supabase = await createServerClient();

  let query = supabase
    .from("posts")
    .select("*, categories(name)", { count: "exact" });

  if (status === "draft" || status === "published") {
    query = query.eq("status", status);
  }

  const { data: posts, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          포스트
        </h1>
        <Link href="/posts/new">
          <Button>새 포스트</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Link href="/posts?status=all">
          <Button variant={status === "all" ? "primary" : "outline"} size="sm">
            전체
          </Button>
        </Link>
        <Link href="/posts?status=published">
          <Button variant={status === "published" ? "primary" : "outline"} size="sm">
            발행됨
          </Button>
        </Link>
        <Link href="/posts?status=draft">
          <Button variant={status === "draft" ? "primary" : "outline"} size="sm">
            임시저장
          </Button>
        </Link>
      </div>

      <PostsTable posts={posts || []} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/posts?page=${p}&status=${status}`}>
              <Button variant={p === page ? "primary" : "outline"} size="sm">
                {p}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
