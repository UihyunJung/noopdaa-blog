"use client";

import { useRouter } from "next/navigation";
import { Button } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { HiOutlineBars3 } from "react-icons/hi2";

interface HeaderProps {
  user: User;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
      <div className="flex items-center gap-4">
        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
        >
          <HiOutlineBars3 className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          관리자
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:block">
          {user.email}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </header>
  );
}
