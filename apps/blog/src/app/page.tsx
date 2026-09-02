import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PostRow } from "@/components/PostRow";
import { FeaturedPosts, type FeaturedPost } from "@/components/FeaturedPosts";
import type { Category, PostWithCategory, SiteSettings } from "@/lib/types";
import { HiOutlineArrowRight, HiOutlineDocumentText } from "react-icons/hi2";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const supabase = await createServerClient();

  const [{ data: posts }, { data: settings }, { data: categories }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, categories(name, slug)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6) as unknown as Promise<{ data: PostWithCategory[] | null }>,
    // 컬럼을 나열하지 않고 *로 가져온다 — site_intro 마이그레이션이 아직 적용되지 않은 환경에서도 홈이 깨지지 않도록
    supabase
      .from("site_settings")
      .select("*")
      .single() as unknown as Promise<{ data: SiteSettings | null }>,
    supabase
      .from("categories")
      .select("name, slug")
      .order("name") as unknown as Promise<{ data: Pick<Category, "name" | "slug">[] | null }>,
  ]);

  // 추천 글 — admin '추천 글'(hero_post_ids)에서 고른 순서대로
  let featuredPosts: FeaturedPost[] = [];
  if (settings?.hero_post_ids && settings.hero_post_ids.length > 0) {
    const { data: featuredData } = await supabase
      .from("posts")
      .select("id, slug, title, excerpt, thumbnail_url, published_at, created_at, categories(name, slug)")
      .in("id", settings.hero_post_ids)
      .eq("status", "published");

    if (featuredData) {
      featuredPosts = settings.hero_post_ids
        .map((id) => featuredData.find((p) => p.id === id))
        .filter(Boolean) as FeaturedPost[];
    }
  }

  const siteName = settings?.site_name || "Blog";
  // 큰 제목은 블로그 설명(좌우명), 한 줄 소개는 비어 있으면 숨긴다 — 둘 다 admin 블로그 설정에서 관리
  const motto = settings?.site_description?.trim();
  const intro = settings?.site_intro?.trim();

  return (
    <div className="min-h-screen">
      {/* 대문 이미지 — 오버레이 없이 그대로, 다크 모드에서는 먹그림을 반전 */}
      {settings?.hero_image_url && (
        <section className="relative h-[180px] overflow-hidden border-b border-line bg-paper-3 sm:h-[300px] lg:h-[400px]">
          <Image
            src={settings.hero_image_url}
            alt={`${siteName} 대문 이미지`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_45%] dark:brightness-90 dark:invert"
          />
        </section>
      )}

      {/* 좌우명 + 한 줄 소개 */}
      <section className="mx-auto grid max-w-[1120px] gap-5 px-5 pb-7 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-12 lg:items-end lg:gap-8 lg:pb-14 lg:pt-[72px]">
        <div className="lg:col-span-7">
          <h1 className="font-serif text-[40px] font-medium leading-[1.2] tracking-tight text-ink sm:text-[56px] lg:text-[64px] lg:leading-[1.18]">
            {motto || siteName}
          </h1>
        </div>
        {intro && (
          <div className="lg:col-span-5 lg:pb-3">
            <p className="text-[15px] leading-relaxed text-ink-2 sm:text-base sm:leading-[1.75]">
              {intro}
            </p>
          </div>
        )}
      </section>

      {/* 카테고리 */}
      <section className="mx-auto max-w-[1120px] px-5 pb-10 sm:px-8 sm:pb-[72px]">
        <div className="flex flex-col gap-1.5 border-y border-line py-3.5 sm:flex-row sm:items-center sm:gap-5 sm:py-3">
          <span className="font-mono text-[11px] tracking-[0.12em] text-ink-3">카테고리</span>
          <nav className="-ml-2.5 flex flex-wrap items-center gap-0.5">
            {categories?.map((category) => (
              <Link
                key={category.slug}
                href={`/posts?category=${category.slug}`}
                className="rounded px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-3 sm:py-1.5"
              >
                {category.name}
              </Link>
            ))}
          </nav>
          <Link
            href="/posts"
            className="hidden items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-accent sm:ml-auto sm:inline-flex"
          >
            전체 포스트
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 추천 글 */}
      {featuredPosts.length > 0 && <FeaturedPosts posts={featuredPosts} />}

      {/* 최근 포스트 */}
      <section className="mx-auto max-w-[1120px] px-5 pb-14 sm:px-8 sm:pb-24">
        <div className="mb-1 flex items-baseline justify-between border-t border-ink pt-4">
          <h2 className="font-serif text-lg font-semibold text-ink sm:text-[22px]">최근 포스트</h2>
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-accent sm:text-sm"
          >
            전체 보기
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!posts || posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border-y border-line py-16 text-ink-3">
            <HiOutlineDocumentText className="h-8 w-8" />
            <p className="text-sm">아직 포스트가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-line">
              {posts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>

            {/* 모바일 전체보기 */}
            <Link
              href="/posts"
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-md border border-ink text-sm font-semibold text-ink transition-colors hover:bg-paper-3 sm:hidden"
            >
              전체 포스트 보기
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
