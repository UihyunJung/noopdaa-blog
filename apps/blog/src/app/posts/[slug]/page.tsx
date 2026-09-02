export const revalidate = 300;

import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { makeExcerpt } from "@noopdaa/ui";
import { createServerClient } from "@/lib/supabase/server";
import { createBuildClient } from "@/lib/supabase/build";
import { formatDateDot, formatViews } from "@/lib/format";
import { PostNavigation } from "./PostNavigation";
import { Comments } from "./Comments";
import { ShareButtons } from "./ShareButtons";
import { TableOfContents } from "./TableOfContents";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

const PostContent = nextDynamic(() => import("./PostContent").then((mod) => mod.PostContent), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 rounded bg-paper-3" />
      <div className="h-4 w-3/4 rounded bg-paper-3" />
      <div className="h-4 w-1/2 rounded bg-paper-3" />
    </div>
  ),
});
import type { Post, PostWithCategory, Tag } from "@/lib/types";
import { HiOutlineCalendarDays, HiOutlineEye } from "react-icons/hi2";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single() as { data: Post | null };

  if (!post || !post.slug) return { title: "포스트를 찾을 수 없습니다" };

  // 발췌에 마크다운 원문이 남아 있을 수 있어 메타 설명에는 서식을 걷어낸 텍스트를 쓴다
  const description = post.meta_description || makeExcerpt(post.excerpt || post.content, 160);

  return {
    title: post.meta_title || post.title,
    description,
    alternates: {
      canonical: `/posts/${post.slug}`,
    },
    openGraph: {
      title: post.meta_title || post.title,
      description,
      images: post.og_image || post.thumbnail_url ? [post.og_image || post.thumbnail_url!] : undefined,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
  };
}

export async function generateStaticParams() {
  const supabase = createBuildClient();
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published");
  return (data ?? [])
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug as string }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single() as { data: PostWithCategory | null };

  if (!post || !post.slug) {
    notFound();
  }

  // 태그, 이전/다음 포스트를 병렬로 가져오기
  // 조회수는 PageViewTracker(클라이언트) → page_views INSERT → DB 트리거로 자동 동기화
  const [
    { data: postTags },
    { data: prevPost },
    { data: nextPost },
  ] = await Promise.all([
    supabase.from("post_tags").select("tags(id, name, slug)").eq("post_id", post.id),
    supabase.from("posts").select("slug, title").eq("status", "published")
      .lt("published_at", post.published_at || post.created_at)
      .order("published_at", { ascending: false }).limit(1).single(),
    supabase.from("posts").select("slug, title").eq("status", "published")
      .gt("published_at", post.published_at || post.created_at)
      .order("published_at", { ascending: true }).limit(1).single(),
  ]);
  const tags = (postTags?.map((pt) => pt.tags).filter(Boolean) || []) as Pick<Tag, "id" | "name" | "slug">[];

  // 목차 존재 여부 확인 (## 또는 ### 헤딩이 있는지)
  const hasTableOfContents = /^#{2,3}\s+.+$/m.test(post.content);

  const dateStr = post.published_at || post.created_at;

  // BlogPosting JSON-LD 스키마 생성
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: dateStr,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: "Noopdaa",
    },
    description: makeExcerpt(post.excerpt || post.content, 160),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/posts/${post.slug}`,
    },
    url: `${siteUrl}/posts/${post.slug}`,
    ...(post.thumbnail_url ? { image: post.thumbnail_url } : {}),
  };

  return (
    <article className="min-h-screen">
      <PageViewTracker pageType="post" postId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingSchema).replace(/</g, "\\u003c"),
        }}
      />

      {/* 제목 영역 — 좌측 정렬, 커버 이미지는 아래에 분리 */}
      <header className="mx-auto max-w-[1000px] px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-[72px]">
        <div className="flex max-w-[760px] flex-col gap-4 sm:gap-5">
          {post.categories && (
            <Link
              href={`/posts?category=${post.categories.slug}`}
              className="text-xs font-semibold tracking-wider text-accent hover:underline"
            >
              {post.categories.name}
            </Link>
          )}
          <h1 className="font-serif text-[28px] font-semibold leading-[1.3] tracking-tight text-ink sm:text-[36px] lg:text-[44px] lg:leading-[1.28]">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-[13px] text-ink-3">
            <time dateTime={dateStr} className="inline-flex items-center gap-1.5 font-mono">
              <HiOutlineCalendarDays className="h-3.5 w-3.5" />
              {formatDateDot(dateStr)}
            </time>
            <span className="h-[3px] w-[3px] rounded-full bg-ink-3" />
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineEye className="h-3.5 w-3.5" />
              {formatViews(post.view_count)}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px]">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/posts?tag=${encodeURIComponent(tag.name)}`}
                  className="text-ink-2 transition-colors hover:text-accent"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 커버 이미지 */}
      {post.thumbnail_url && (
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
          <div className="relative aspect-[21/9] overflow-hidden border border-line bg-paper-3">
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1000px) 100vw, 936px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* 본문 영역 */}
      <div className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8 sm:py-14">
        <div className={hasTableOfContents ? "grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16" : ""}>
          <div className="min-w-0 lg:max-w-[680px]">
            <PostContent content={post.content} />

            <ShareButtons title={post.title} slug={post.slug} />

            <PostNavigation
              prevPost={prevPost as { slug: string; title: string } | null}
              nextPost={nextPost as { slug: string; title: string } | null}
            />

            <Comments postId={post.id} />
          </div>

          {/* 목차 — 데스크톱에서만, 헤딩이 있을 때만 */}
          {hasTableOfContents && (
            <aside className="hidden lg:block">
              <div className="sticky top-[88px]">
                <TableOfContents content={post.content} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
