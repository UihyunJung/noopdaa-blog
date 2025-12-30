import { createServerClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import type { Post, Category } from "@/lib/types";

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
        // 해당 태그의 포스트가 없으면 빈 결과
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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        포스트
      </h1>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter
          categories={categories || []}
          currentCategory={params.category}
        />
        <SearchBar defaultValue={params.q} />
      </div>

      {params.tag && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">태그:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
            #{params.tag}
            <a
              href="/posts"
              className="ml-1 rounded-full p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </a>
          </span>
        </div>
      )}

      {!posts || posts.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {params.q
              ? `"${params.q}"에 대한 검색 결과가 없습니다.`
              : "포스트가 없습니다."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/posts?page=${p}${params.category ? `&category=${params.category}` : ""}${params.tag ? `&tag=${encodeURIComponent(params.tag)}` : ""}${params.q ? `&q=${params.q}` : ""}`}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    p === page
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
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
  );
}
