"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
} from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";
import { fetchAuthCheck } from "@/lib/auth-client";

interface HeaderProps {
  siteName: string;
}

// 로그인 여부 확인 전에는 버튼을 그리지 않는다 (관리자에게 '로그인'이 잠깐 보이는 것 방지)
type AuthState = { checked: boolean; isAdmin: boolean };

export function Header({ siteName }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ checked: false, isAdmin: false });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAuthCheck().then((res) => {
      if (!cancelled) setAuth({ checked: true, isAdmin: res.isAdmin });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await createClient().auth.signOut();
      toast.success("로그아웃했습니다.");
      // 현재 페이지를 그대로 다시 로드해 서버 컴포넌트에도 로그아웃을 반영
      window.location.reload();
    } catch (err) {
      console.error("로그아웃 오류:", err);
      toast.error("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
    }
  };

  const navigation = [
    { name: "홈", href: "/" },
    { name: "포스트", href: "/posts" },
  ];

  // 로그인 후 원래 보던 페이지로 돌아오도록 현재 경로를 넘긴다
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;
  // /login에서는 헤더 버튼이 중복이므로 숨긴다
  const showAuthButton = auth.checked && pathname !== "/login";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link
            href="/"
            className="group flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-lg shadow-primary-500/25">
              {siteName.charAt(0)}
            </div>
            <span className="font-semibold text-zinc-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
              {siteName}
            </span>
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                {item.name}
              </Link>
            ))}

            <div className="ml-2 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

            {showAuthButton &&
              (auth.isAdmin ? (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <HiOutlineArrowLeftOnRectangle className="h-4 w-4" />
                  로그아웃
                </button>
              ) : (
                <Link
                  href={loginHref}
                  className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                  로그인
                </Link>
              ))}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="테마 변경"
            >
              <HiOutlineMoon className="h-5 w-5 dark:hidden" />
              <HiOutlineSun className="hidden h-5 w-5 dark:block" />
            </button>
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
          >
            {isMenuOpen ? (
              <HiOutlineXMark className="h-6 w-6" />
            ) : (
              <HiOutlineBars3 className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* 모바일 네비게이션 */}
        {isMenuOpen && (
          <nav className="border-t border-zinc-200 py-4 dark:border-zinc-800 md:hidden">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {showAuthButton &&
                (auth.isAdmin ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <HiOutlineArrowLeftOnRectangle className="h-5 w-5" />
                    로그아웃
                  </button>
                ) : (
                  <Link
                    href={loginHref}
                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
                    로그인
                  </Link>
                ))}

              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setIsMenuOpen(false);
                }}
                className="mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {theme === "dark" ? (
                  <>
                    <HiOutlineSun className="h-5 w-5" />
                    라이트 모드
                  </>
                ) : (
                  <>
                    <HiOutlineMoon className="h-5 w-5" />
                    다크 모드
                  </>
                )}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
