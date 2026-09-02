import Link from "next/link";
import { stripMarkdown } from "@noopdaa/ui";
import { formatDateDot } from "@/lib/format";
import { Thumbnail } from "./Thumbnail";

export interface FeaturedPost {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  categories: { name: string; slug: string } | null;
}

interface FeaturedPostsProps {
  posts: FeaturedPost[];
}

// 홈 추천 글 — admin '추천 글'(site_settings.hero_post_ids) 순서대로, 첫 글은 크게 나머지는 옆에 작게
export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  const [lead, ...rest] = posts.filter((p) => p.slug);
  if (!lead) return null;

  return (
    <section className="mx-auto max-w-[1120px] px-5 pb-16 sm:px-8 sm:pb-20">
      <div className="mb-6 flex items-baseline justify-between border-t border-ink pt-4 sm:mb-8">
        <h2 className="font-serif text-lg font-semibold text-ink sm:text-[22px]">추천 글</h2>
        <span className="font-mono text-xs tracking-wide text-ink-3">{posts.length}편</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <article className="group flex flex-col gap-4 lg:col-span-7">
          <Link href={`/posts/${lead.slug}`} aria-label={lead.title}>
            <Thumbnail
              src={lead.thumbnail_url}
              alt={lead.title}
              sizes="(max-width: 1024px) 100vw, 620px"
              priority
              className="aspect-video w-full"
            />
          </Link>
          <FeaturedMeta post={lead} />
          <h3 className="font-serif text-2xl font-semibold leading-[1.3] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-[32px]">
            <Link href={`/posts/${lead.slug}`}>{lead.title}</Link>
          </h3>
          {lead.excerpt && (
            <p className="text-base leading-relaxed text-ink-2">{stripMarkdown(lead.excerpt)}</p>
          )}
        </article>

        {rest.length > 0 && (
          <div className="flex flex-col lg:col-span-5">
            {rest.map((post, index) => (
              <article
                key={post.id}
                className={`group flex gap-5 border-b border-line ${index === 0 ? "pb-6" : "py-6"}`}
              >
                <Link href={`/posts/${post.slug}`} aria-label={post.title} className="shrink-0">
                  <Thumbnail
                    src={post.thumbnail_url}
                    alt={post.title}
                    sizes="132px"
                    className="h-[88px] w-[132px]"
                  />
                </Link>
                <div className="flex min-w-0 flex-col gap-2">
                  <FeaturedMeta post={post} />
                  <h3 className="font-serif text-[17px] font-semibold leading-[1.4] text-ink transition-colors group-hover:text-accent sm:text-[19px]">
                    <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  </h3>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedMeta({ post }: { post: FeaturedPost }) {
  const dateStr = post.published_at || post.created_at;
  return (
    <div className="flex items-center gap-3 text-xs">
      {post.categories && (
        <Link
          href={`/posts?category=${post.categories.slug}`}
          className="font-semibold tracking-wide text-accent hover:underline"
        >
          {post.categories.name}
        </Link>
      )}
      <time dateTime={dateStr} className="font-mono text-ink-3">
        {formatDateDot(dateStr)}
      </time>
    </div>
  );
}
