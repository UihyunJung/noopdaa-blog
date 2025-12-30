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
    <article className="mx-auto max-w-4xl px-4 py-12">
      <PageViewTracker pageType="post" postId={post.id} />
      {/* Header */}
      <header className="mb-8 text-center">
        {post.categories && (
          <a
            href={`/posts?category=${post.categories.slug}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {post.categories.name}
          </a>
        )}
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <time dateTime={post.published_at || post.created_at}>
            {new Date(post.published_at || post.created_at).toLocaleDateString(
              "ko-KR",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </time>
          <span>·</span>
          <span>{post.view_count + 1} 조회</span>
        </div>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tags.map((tag: any) => (
              <a
                key={tag.id}
                href={`/posts?tag=${encodeURIComponent(tag.name)}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                #{tag.name}
              </a>
            ))}
          </div>
        )}
      </header>

      <div className={hasTableOfContents ? "grid gap-8 lg:grid-cols-[1fr_220px]" : ""}>
        {/* Content */}
        <div>
          <PostContent content={post.content} />

          <ShareButtons title={post.title} postId={post.id} />

          <PostNavigation prevPost={prevPost} nextPost={nextPost} />

          <Comments postId={post.id} postTitle={post.title} />
        </div>

        {/* Sidebar - 목차가 있을 때만 표시 */}
        {hasTableOfContents && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <TableOfContents content={post.content} />
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
