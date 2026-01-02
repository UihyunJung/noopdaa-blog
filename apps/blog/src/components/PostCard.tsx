import Link from "next/link";
import Image from "next/image";
import type { Post, Category } from "@/lib/types";
import { HiOutlineDocumentText } from "react-icons/hi2";

interface PostCardProps {
  post: Post & { categories: Pick<Category, "name" | "slug"> | null };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group">
      <Link href={`/posts/${post.id}`} className="block">
        {/* 썸네일 */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <HiOutlineDocumentText className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}

          {/* 카테고리 배지 */}
          {post.categories && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-200">
                {post.categories.name}
              </span>
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="mt-4">
          <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {post.excerpt}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
            <time dateTime={post.published_at || post.created_at}>
              {new Date(post.published_at || post.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span>{post.view_count?.toLocaleString() || 0} 조회</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
