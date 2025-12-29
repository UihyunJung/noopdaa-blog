import Link from "next/link";

interface PostNavigationProps {
  prevPost: { id: string; title: string } | null;
  nextPost: { id: string; title: string } | null;
}

export function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav className="my-8 grid gap-4 sm:grid-cols-2">
      {prevPost ? (
        <Link
          href={`/posts/${prevPost.id}`}
          className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-500 dark:border-gray-700 dark:hover:border-primary-500"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ← 이전 포스트
          </span>
          <p className="mt-1 font-medium text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {prevPost.title}
          </p>
        </Link>
      ) : (
        <div />
      )}

      {nextPost && (
        <Link
          href={`/posts/${nextPost.id}`}
          className="group rounded-lg border border-gray-200 p-4 text-right transition-colors hover:border-primary-500 dark:border-gray-700 dark:hover:border-primary-500"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            다음 포스트 →
          </span>
          <p className="mt-1 font-medium text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {nextPost.title}
          </p>
        </Link>
      )}
    </nav>
  );
}
