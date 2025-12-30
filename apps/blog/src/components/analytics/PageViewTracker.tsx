"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface PageViewTrackerProps {
  pageType?: string;
  postId?: string;
}

export function PageViewTracker({ pageType = "page", postId }: PageViewTrackerProps) {
  const pathname = usePathname();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    // 같은 경로 중복 트래킹 방지
    const trackKey = `${pathname}_${postId || ""}`;
    if (trackedRef.current === trackKey) {
      return;
    }

    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pagePath: pathname,
            pageType,
            postId: postId || null,
            referrer: document.referrer || null,
          }),
        });
        trackedRef.current = trackKey;
      } catch (error) {
        // 실패해도 사용자 경험에 영향 없음
        console.error("Failed to track page view:", error);
      }
    };

    trackPageView();
  }, [pathname, pageType, postId]);

  return null;
}
