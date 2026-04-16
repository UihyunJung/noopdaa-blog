"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 페이지 전환 시 스크롤을 최상단으로 초기화
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
