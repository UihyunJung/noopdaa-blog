import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import type { Post, Category } from "@/lib/types";

type PostWithCategory = Post & { categories: Pick<Category, "name" | "slug"> | null };

export default async function HomePage() {
  const supabase = await createServerClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, categories(name, slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6) as { data: PostWithCategory[] | null };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Noopdaa Blog
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            개발과 기술에 대한 이야기를 나눕니다
          </p>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            최근 포스트
          </h2>
          <Link
            href="/posts"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            전체 보기 →
          </Link>
        </div>

        {!posts || posts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            아직 포스트가 없습니다.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
