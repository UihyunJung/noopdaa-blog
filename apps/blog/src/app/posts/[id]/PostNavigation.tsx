import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";

interface PostNavigationProps {
  prevPost: { id: string; title: string } | null;
  nextPost: { id: string; title: string } | null;
}

export function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav className="my-10 grid gap-4 sm:grid-cols-2">
      {prevPost ? (
        <Link
          href={`/posts/${prevPost.id}`}
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-primary-700"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-primary-950/30" />
          <div className="relative">
            <span className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <HiOutlineArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              이전 포스트
            </span>
            <p className="mt-2 line-clamp-2 font-medium text-zinc-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
              {prevPost.title}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {nextPost && (
        <Link
          href={`/posts/${nextPost.id}`}
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 text-right transition-all hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-primary-700"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-primary-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-primary-950/30" />
          <div className="relative">
            <span className="flex items-center justify-end gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              다음 포스트
              <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <p className="mt-2 line-clamp-2 font-medium text-zinc-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
              {nextPost.title}
            </p>
          </div>
        </Link>
      )}
    </nav>
  );
}
