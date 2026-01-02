"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@noopdaa/ui";
import {
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineTag,
  HiOutlinePhoto,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlineUser,
  HiOutlineXMark,
} from "react-icons/hi2";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: HiOutlineHome },
  { name: "통계", href: "/analytics", icon: HiOutlineChartBar },
  { name: "포스트", href: "/posts", icon: HiOutlineDocumentText },
  { name: "카테고리", href: "/categories", icon: HiOutlineFolder },
  { name: "태그", href: "/tags", icon: HiOutlineTag },
  { name: "미디어", href: "/media", icon: HiOutlinePhoto },
  { name: "댓글", href: "/comments", icon: HiOutlineChatBubbleLeftRight },
  { name: "블로그 설정", href: "/settings", icon: HiOutlineCog6Tooth },
  { name: "프로필", href: "/profile", icon: HiOutlineUser },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-700 dark:bg-gray-800 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <Link href="/dashboard" className="text-xl font-bold text-primary-600">
            Noopdaa Blog
          </Link>
          {/* 모바일 닫기 버튼 */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
