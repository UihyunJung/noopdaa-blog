import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PostContent } from "./PostContent";
import { PostNavigation } from "./PostNavigation";
import { Comments } from "./Comments";
import { ShareButtons } from "./ShareButtons";
import { TableOfContents } from "./TableOfContents";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import type { Post, Category } from "@/lib/types";
import { HiOutlineCalendarDays, HiOutlineEye } from "react-icons/hi2";

type PostWithCategory = Post & { categories: Pick<Category, "name" | "slug"> | null };

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single() as { data: Post | null };

  if (!post) return { title: "포스트를 찾을 수 없습니다" };

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      images: post.og_image || post.thumbnail_url ? [post.og_image || post.thumbnail_url!] : undefined,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, categories(name, slug)")
    .eq("id", id)
    .eq("status", "published")
    .single() as { data: PostWithCategory | null };

  if (!post) {
    notFound();
  }

  // 조회수 증가
  await supabase
    .from("posts")
    .update({ view_count: post.view_count + 1 })
    .eq("id", post.id);

  // 태그 가져오기
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("tags(id, name, slug)")
    .eq("post_id", post.id);

  const tags = postTags?.map((pt) => pt.tags).filter(Boolean) || [];

  // 목차 존재 여부 확인 (## 또는 ### 헤딩이 있는지)
  const hasTableOfContents = /^#{2,3}\s+.+$/m.test(post.content);

  // 이전/다음 포스트
  const [{ data: prevPost }, { data: nextPost }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title")
      .eq("status", "published")
      .lt("published_at", post.published_at || post.created_at)
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("posts")
      .select("id, title")
      .eq("status", "published")
      .gt("published_at", post.published_at || post.created_at)
      .order("published_at", { ascending: true })
      .limit(1)
      .single(),
  ]);

  return (
    <article className="min-h-screen">
      <PageViewTracker pageType="post" postId={post.id} />

      {/* 히어로 헤더 영역 */}
      <header className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        {/* 배경 이미지 (커버 이미지가 있는 경우) */}
        {post.thumbnail_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${post.thumbnail_url})` }}
            />
            <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-primary-950/20" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-900/20" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-primary-100/40 blur-3xl dark:bg-primary-800/10" />
          </>
        )}

        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-14">
          {post.categories && (
            <a
              href={`/posts?category=${post.categories.slug}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                post.thumbnail_url
                  ? "bg-primary-500/80 text-white hover:bg-primary-500"
                  : "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60"
              }`}
            >
              {post.categories.name}
            </a>
          )}
          <h1
            className={`mt-5 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${
              post.thumbnail_url ? "text-white" : "text-zinc-900 dark:text-white"
            }`}
          >
            {post.title}
          </h1>
          <div
            className={`mt-4 flex items-center justify-center gap-3 text-sm ${
              post.thumbnail_url ? "text-zinc-200" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <time dateTime={post.published_at || post.created_at} className="flex items-center gap-1.5">
              <HiOutlineCalendarDays className="h-4 w-4" />
              {new Date(post.published_at || post.created_at).toLocaleDateString(
                "ko-KR",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </time>
            <span
              className={`h-1 w-1 rounded-full ${
                post.thumbnail_url ? "bg-zinc-400" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            <span className="flex items-center gap-1.5">
              <HiOutlineEye className="h-4 w-4" />
              {(post.view_count + 1).toLocaleString()} 조회
            </span>
          </div>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {tags.map((tag: any) => (
                <a
                  key={tag.id}
                  href={`/posts?tag=${encodeURIComponent(tag.name)}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    post.thumbnail_url
                      ? "bg-white/90 text-zinc-700 hover:bg-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  #{tag.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 본문 영역 */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className={hasTableOfContents ? "grid gap-12 lg:grid-cols-[1fr_240px]" : ""}>
          {/* Content */}
          <div className="min-w-0">
            <PostContent content={post.content} />

            <ShareButtons title={post.title} postId={post.id} />

            <PostNavigation prevPost={prevPost} nextPost={nextPost} />

            <Comments postId={post.id} postTitle={post.title} />
          </div>

          {/* Sidebar - 목차가 있을 때만 표시 */}
          {hasTableOfContents && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents content={post.content} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
