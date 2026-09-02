"use client";

import { toast } from "sonner";
import { FaXTwitter, FaFacebookF, FaThreads } from "react-icons/fa6";
import { HiOutlineLink } from "react-icons/hi2";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-2 transition-colors hover:border-ink-3 hover:bg-paper-3 hover:text-ink";

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
  const url = `${siteUrl}/posts/${slug}`;

  const shareLinks = [
    {
      name: "X",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: <FaXTwitter className="h-3.5 w-3.5" />,
    },
    {
      name: "페이스북",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <FaFacebookF className="h-4 w-4" />,
    },
    {
      name: "스레드",
      url: `https://www.threads.net/intent/post?text=${encodeURIComponent(title + " " + url)}`,
      icon: <FaThreads className="h-4 w-4" />,
    },
    // Instagram은 웹 공유 intent가 없어 제외 (홈으로만 이동했었음)
  ];

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("링크가 복사되었습니다.");
  };

  return (
    <div className="mt-12 flex items-center justify-between border-y border-line py-5">
      <span className="text-[13px] font-medium text-ink-2">이 글 공유하기</span>
      <div className="flex gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClass}
            aria-label={`${link.name}에 공유`}
          >
            {link.icon}
          </a>
        ))}
        <button onClick={handleCopyLink} className={iconButtonClass} aria-label="링크 복사">
          <HiOutlineLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
