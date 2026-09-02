import Link from "next/link";
import { stripMarkdown } from "@noopdaa/ui";
import type { PostWithCategory } from "@/lib/types";
import { formatDateDot, formatViews } from "@/lib/format";
import { Thumbnail } from "./Thumbnail";

interface PostRowProps {
  post: PostWithCategory;
}

// 포스트 목록 한 줄 — 데스크톱: 날짜 | 카테고리·제목·발췌·조회수 | 썸네일, 모바일: 메타·제목 | 작은 썸네일
export function PostRow({ post }: PostRowProps) {
  if (!post.slug) return null;

  const href = `/posts/${post.slug}`;
  const dateStr = post.published_at || post.created_at;
  // 발췌에 마크다운 원문이 섞여 있을 수 있어 표시 전에 서식 기호를 제거
  const excerpt = post.excerpt ? stripMarkdown(post.excerpt) : "";

  return (
    <article className="group grid grid-cols-[minmax(0,1fr)_96px] gap-4 border-t border-line py-5 sm:grid-cols-[112px_minmax(0,1fr)_200px] sm:gap-8 sm:py-7">
      <time
        dateTime={dateStr}
        className="hidden font-mono text-[13px] text-ink-3 sm:block sm:pt-1.5"
      >
        {formatDateDot(dateStr)}
      </time>

      <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2.5">
        <div className="flex items-center gap-2.5 text-xs">
          {post.categories && (
            <Link
              href={`/posts?category=${post.categories.slug}`}
              className="font-semibold tracking-wide text-accent hover:underline"
            >
              {post.categories.name}
            </Link>
          )}
          <time dateTime={dateStr} className="font-mono text-ink-3 sm:hidden">
            {formatDateDot(dateStr)}
          </time>
        </div>

        <h3 className="font-serif text-[17px] font-semibold leading-[1.4] text-ink transition-colors group-hover:text-accent sm:text-2xl sm:leading-[1.35]">
          <Link href={href} className="line-clamp-2 sm:line-clamp-none">
            {post.title}
          </Link>
        </h3>

        {excerpt && (
          <p className="hidden line-clamp-2 text-[15px] leading-relaxed text-ink-2 sm:block">
            {excerpt}
          </p>
        )}

        <span className="text-xs text-ink-3">{formatViews(post.view_count)}</span>
      </div>

      <Link href={href} aria-label={post.title} className="block">
        <Thumbnail
          src={post.thumbnail_url}
          alt={post.title}
          sizes="(max-width: 640px) 96px, 200px"
          className="h-16 w-24 sm:h-[125px] sm:w-[200px]"
        />
      </Link>
    </article>
  );
}
