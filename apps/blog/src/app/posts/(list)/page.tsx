export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PostRow } from "@/components/PostRow";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import type { PostWithCategory, Category } from "@/lib/types";
import {
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

export const metadata: Metadata = {
  title: "포스트",
  alternates: {
    canonical: "/posts",
  },
};

interface PostsPageProps {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; page?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  // 비숫자/음수 page 파라미터 방어 (NaN·음수 range는 쿼리 오류 유발)
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
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
    // 1) LIKE 와일드카드(%_\) 이스케이프
    const likeEscaped = params.q.replace(/[\\%_]/g, (c) => "\\" + c);
    // 2) PostgREST quoted literal 이스케이프(\, ") 후 큰따옴표로 감싸기
    //    — 검색어에 쉼표/괄호가 있어도 or() 필터 구분자와 충돌하지 않음
    const quoted = likeEscaped.replace(/(["\\])/g, "\\$1");
    query = query.or(`title.ilike."%${quoted}%",content.ilike."%${quoted}%"`);
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
  const hasFilter = Boolean(params.q || params.category || params.tag);

  // 페이지 링크에 현재 필터를 그대로 유지
  const pageHref = (p: number) =>
    `/posts?page=${p}${params.category ? `&category=${params.category}` : ""}${
      params.tag ? `&tag=${encodeURIComponent(params.tag)}` : ""
    }${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;

  return (
    <div className="min-h-screen">
      {/* 제목 */}
      <section className="mx-auto flex max-w-[1120px] flex-col gap-2 px-5 pb-6 pt-10 sm:flex-row sm:items-baseline sm:justify-between sm:px-8 sm:pt-16">
        <h1 className="font-serif text-[32px] font-medium tracking-tight text-ink sm:text-[40px]">
          포스트
        </h1>
        <p className="text-[15px] text-ink-2">
          {count ? `${count}개의 글이 있습니다` : "아직 작성된 글이 없습니다"}
        </p>
      </section>

      {/* 필터 바 (헤더 아래 고정) */}
      <div className="sticky top-14 z-40 border-y border-line bg-paper sm:top-16">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
          <CategoryFilter categories={categories || []} currentCategory={params.category} />
          <div className="pb-3 sm:pb-0">
            <SearchBar defaultValue={params.q} />
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-2 sm:px-8 sm:pb-24">
        {/* 태그 필터 표시 */}
        {params.tag && (
          <div className="flex items-center gap-3 py-5">
            <span className="font-mono text-[11px] tracking-[0.12em] text-ink-3">태그</span>
            <span className="inline-flex h-[30px] items-center gap-1 rounded border border-ink pl-2.5 pr-1 text-[13px] font-semibold text-ink">
              #{params.tag}
              <Link
                href="/posts"
                className="flex h-[22px] w-[22px] items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
                aria-label="태그 필터 해제"
              >
                <HiOutlineXMark className="h-3 w-3" />
              </Link>
            </span>
            <span className="text-[13px] text-ink-3">{count || 0}개의 글</span>
          </div>
        )}

        {/* 검색 결과 표시 */}
        {params.q && (
          <p className="py-5 text-[15px] text-ink-2">
            <strong className="font-semibold text-ink">&ldquo;{params.q}&rdquo;</strong>
            {" "}검색 결과 {count || 0}건
          </p>
        )}

        {!posts || posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3.5 border-y border-line py-14 text-ink-3">
            <HiOutlineMagnifyingGlass className="h-7 w-7" />
            <p className="text-[15px] text-ink-2">
              {params.q
                ? `"${params.q}"에 대한 검색 결과가 없습니다.`
                : "포스트가 없습니다."}
            </p>
            {hasFilter && (
              <Link
                href="/posts"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-accent"
              >
                전체 포스트 보기
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="border-b border-line">
              {posts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 pt-7" aria-label="페이지">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
                  >
                    <HiOutlineArrowLeft className="h-3.5 w-3.5" />
                    이전
                  </Link>
                ) : (
                  <span className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[13px] font-medium text-ink-3">
                    <HiOutlineArrowLeft className="h-3.5 w-3.5" />
                    이전
                  </span>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                  p === page ? (
                    <span
                      key={p}
                      className="inline-flex h-9 w-9 items-center justify-center rounded bg-ink font-mono text-[13px] font-medium text-paper"
                      aria-current="page"
                    >
                      {p}
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded font-mono text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
                    >
                      {p}
                    </Link>
                  )
                )}
                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
                  >
                    다음
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[13px] font-medium text-ink-3">
                    다음
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
