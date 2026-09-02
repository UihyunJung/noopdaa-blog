import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";

interface PostNavigationProps {
  prevPost: { slug: string; title: string } | null;
  nextPost: { slug: string; title: string } | null;
}

export function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav className="grid gap-6 border-b border-line py-7 sm:grid-cols-2 sm:gap-8" aria-label="이전·다음 글">
      {prevPost ? (
        <Link href={`/posts/${prevPost.slug}`} className="group flex flex-col gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            <HiOutlineArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            이전 글
          </span>
          <span className="line-clamp-2 font-serif text-[17px] font-semibold leading-[1.45] text-ink transition-colors group-hover:text-accent">
            {prevPost.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {nextPost && (
        <Link
          href={`/posts/${nextPost.slug}`}
          className="group flex flex-col items-end gap-2.5 text-right"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            다음 글
            <HiOutlineArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="line-clamp-2 font-serif text-[17px] font-semibold leading-[1.45] text-ink transition-colors group-hover:text-accent">
            {nextPost.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
