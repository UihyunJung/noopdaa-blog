import Image from "next/image";
import { cn } from "@noopdaa/ui";
import { HiOutlinePhoto } from "react-icons/hi2";

interface ThumbnailProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

// 포스트 썸네일 — 이미지가 없으면 종이색 자리표시자를 그린다
// 부모가 `group`이면 hover 시 테두리가 진해지고 이미지가 살짝 확대된다
export function Thumbnail({ src, alt, sizes, className, priority }: ThumbnailProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-line bg-paper-3 transition-colors group-hover:border-ink-3",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-3">
          <HiOutlinePhoto className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}
