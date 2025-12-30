import Link from "next/link";
import Image from "next/image";
import type { Post, Category } from "@/lib/types";

interface PostCardProps {
  post: Post & { categories: Pick<Category, "name" | "slug"> | null };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <Link href={`/posts/${post.id}`}>
        {post.thumbnail_url ? (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-gray-100 dark:bg-gray-700">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}

        <div className="p-4">
          {post.categories && (
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {post.categories.name}
            </span>
          )}
          <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {post.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <time dateTime={post.published_at || post.created_at}>
              {new Date(post.published_at || post.created_at).toLocaleDateString(
                "ko-KR"
              )}
            </time>
            <span>·</span>
            <span>{post.view_count} 조회</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
