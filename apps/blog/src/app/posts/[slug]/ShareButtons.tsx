"use client";

import { toast } from "sonner";
import { FaXTwitter, FaFacebookF, FaThreads, FaInstagram } from "react-icons/fa6";
import { HiOutlineLink, HiOutlineShare } from "react-icons/hi2";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
  const url = `${siteUrl}/posts/${slug}`;

  const shareLinks = [
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: <FaXTwitter className="h-5 w-5" />,
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <FaFacebookF className="h-5 w-5" />,
    },
    {
      name: "Threads",
      url: `https://www.threads.net/intent/post?text=${encodeURIComponent(title + " " + url)}`,
      icon: <FaThreads className="h-5 w-5" />,
    },
    {
      name: "Instagram",
      url: `https://www.instagram.com/`,
      icon: <FaInstagram className="h-5 w-5" />,
    },
  ];

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("링크가 복사되었습니다.");
  };

  return (
    <div className="my-10 flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-800/30 sm:flex-row sm:justify-between">
      <span className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <HiOutlineShare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        이 글이 도움이 되셨나요? 공유해주세요!
      </span>
      <div className="flex gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-white p-2.5 text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition-all hover:bg-zinc-50 hover:text-zinc-700 hover:shadow dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            aria-label={`${link.name}에 공유`}
          >
            {link.icon}
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          className="rounded-xl bg-white p-2.5 text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition-all hover:bg-zinc-50 hover:text-zinc-700 hover:shadow dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          aria-label="링크 복사"
        >
          <HiOutlineLink className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
