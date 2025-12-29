import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

export async function PopularPosts() {
  const supabase = await createServerClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, view_count, status")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(5);

  if (!posts || posts.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        아직 발행된 포스트가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {posts.map((post, index) => (
        <li key={post.id} className="flex items-center gap-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {index + 1}
          </span>
          <div className="flex-1">
            <Link
              href={`/posts/${post.id}/edit`}
              className="text-sm font-medium text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
            >
              {post.title}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {post.view_count.toLocaleString()} 조회
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
