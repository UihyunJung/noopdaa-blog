import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import { HeroSection } from "@/components/HeroSection";
import type { Post, Category } from "@/lib/types";
import { HiOutlineChevronRight, HiOutlineDocumentText } from "react-icons/hi2";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

type PostWithCategory = Post & { categories: Pick<Category, "name" | "slug"> | null };

interface SiteSettings {
  site_name: string;
  site_description: string | null;
  hero_image_url: string | null;
  hero_post_ids: string[] | null;
}

interface HeroPost {
  id: string;
  title: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  categories: { name: string; slug: string } | null;
}

export default async function HomePage() {
  const supabase = await createServerClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, categories(name, slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6) as { data: PostWithCategory[] | null };

  const { data: settings } = await supabase
    .from("site_settings")
    .select("site_name, site_description, hero_image_url, hero_post_ids")
    .single() as { data: SiteSettings | null };

  // 히어로 포스트 로드
  let heroPosts: HeroPost[] = [];
  if (settings?.hero_post_ids && settings.hero_post_ids.length > 0) {
    const { data: heroPostsData } = await supabase
      .from("posts")
      .select("id, title, excerpt, thumbnail_url, categories(name, slug)")
      .in("id", settings.hero_post_ids)
      .eq("status", "published");

    if (heroPostsData) {
      // hero_post_ids 순서대로 정렬
      heroPosts = settings.hero_post_ids
        .map((id) => heroPostsData.find((p) => p.id === id))
        .filter(Boolean) as HeroPost[];
    }
  }

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <HeroSection
        siteName={settings?.site_name || "Blog"}
        siteDescription={settings?.site_description || null}
        heroImageUrl={settings?.hero_image_url || null}
        heroPosts={heroPosts}
      />

      {/* 최근 포스트 */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
              최근 포스트
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              새롭게 작성된 글을 확인해보세요
            </p>
          </div>
          <Link
            href="/posts"
            className="hidden items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-500 dark:text-primary-400 sm:flex"
          >
            전체 보기
            <HiOutlineChevronRight className="h-4 w-4 -translate-y-px" />
          </Link>
        </div>

        {!posts || posts.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
            <HiOutlineDocumentText className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              아직 포스트가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* 모바일 전체보기 */}
            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                전체 포스트 보기
                <HiOutlineChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
