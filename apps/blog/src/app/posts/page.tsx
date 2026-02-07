export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import type { Post, Category } from "@/lib/types";
import { HiOutlineXMark, HiOutlineMagnifyingGlass, HiOutlineChevronRight } from "react-icons/hi2";

export const metadata: Metadata = {
  title: "포스트",
  alternates: {
    canonical: "/posts",
  },
};

type PostWithCategory = Post & { categories: Pick<Category, "name" | "slug"> | null };

interface PostsPageProps {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; page?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const perPage = 9;

  const supabase = await createServerClient();

  let query = supabase
    .from("posts")
    .select("*, categories(name, slug)", { count: "exact" })
    .eq("status", "published");

  if (params.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single();
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  // 태그 필터링
  let tagFilteredPostIds: string[] | null = null;
  if (params.tag) {
    const { data: tag } = await supabase
      .from("tags")
      .select("id")
      .eq("name", params.tag)
      .single();

    if (tag) {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("post_id")
        .eq("tag_id", tag.id);

      tagFilteredPostIds = postTags?.map((pt) => pt.post_id) || [];
      if (tagFilteredPostIds.length > 0) {
        query = query.in("id", tagFilteredPostIds);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }
  }

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`);
  }

  const result = await query
    .order("published_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const posts = result.data as PostWithCategory[] | null;
  const count = result.count;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name") as { data: Category[] | null };

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="min-h-screen">
      {/* 헤더 영역 */}
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
            포스트
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {count ? `${count}개의 글이 있습니다` : "아직 작성된 글이 없습니다"}
          </p>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="sticky top-16 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CategoryFilter
              categories={categories || []}
              currentCategory={params.category}
            />
            <SearchBar defaultValue={params.q} />
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* 태그 필터 표시 */}
        {params.tag && (
          <div className="mb-8 flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">태그:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              #{params.tag}
              <a
                href="/posts"
                className="rounded-full p-0.5 transition-colors hover:bg-primary-200 dark:hover:bg-primary-800"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </a>
            </span>
          </div>
        )}

        {/* 검색 결과 표시 */}
        {params.q && (
          <div className="mb-8">
            <p className="text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-white">"{params.q}"</span>
              {" "}검색 결과 {count || 0}건
            </p>
          </div>
        )}

        {!posts || posts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 py-20 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
            <HiOutlineMagnifyingGlass className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              {params.q
                ? `"${params.q}"에 대한 검색 결과가 없습니다.`
                : "포스트가 없습니다."}
            </p>
            {(params.q || params.category || params.tag) && (
              <a
                href="/posts"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                전체 포스트 보기
                <HiOutlineChevronRight className="h-4 w-4" />
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/posts?page=${p}${params.category ? `&category=${params.category}` : ""}${params.tag ? `&tag=${encodeURIComponent(params.tag)}` : ""}${params.q ? `&q=${params.q}` : ""}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      p === page
                        ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
