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

const navigation = [
  { name: "홈", href: "/" },
  { name: "포스트", href: "/posts" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const ghostButtonClass =
  "flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink disabled:opacity-50";

export function Header({ siteName }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ checked: false, isAdmin: false });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

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
      // scope: "local" — 기본값 "global"은 이 사용자의 모든 기기·브라우저 세션을
      // 서버에서 폐기해 admin 앱까지 함께 로그아웃된다. 블로그 로그아웃은
      // 이 브라우저의 블로그 세션만 끝내야 한다
      await createClient().auth.signOut({ scope: "local" });
      toast.success("로그아웃했습니다.");
      // 현재 페이지를 그대로 다시 로드해 서버 컴포넌트에도 로그아웃을 반영
      window.location.reload();
    } catch (err) {
      console.error("로그아웃 오류:", err);
      toast.error("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
    }
  };

  // 로그인 후 원래 보던 페이지로 돌아오도록 현재 경로를 넘긴다
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;
  // /login에서는 헤더 버튼이 중복이므로 숨긴다
  const showAuthButton = auth.checked && pathname !== "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* 워드마크 */}
          <Link
            href="/"
            className="font-serif text-lg font-semibold tracking-tight text-ink transition-colors hover:text-accent sm:text-xl"
          >
            {siteName}
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded px-3 py-2 text-sm font-medium transition-colors hover:text-ink ${
                  isActive(pathname, item.href) ? "text-ink" : "text-ink-2"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="mx-2 h-[18px] w-px bg-line" />

            {showAuthButton &&
              (auth.isAdmin ? (
                <button onClick={handleLogout} disabled={isLoggingOut} className={ghostButtonClass}>
                  <HiOutlineArrowLeftOnRectangle className="h-4 w-4" />
                  로그아웃
                </button>
              ) : (
                <Link href={loginHref} className={ghostButtonClass}>
                  <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                  로그인
                </Link>
              ))}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-1 rounded-md p-2 text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
              aria-label="테마 변경"
            >
              <HiOutlineMoon className="h-5 w-5 dark:hidden" />
              <HiOutlineSun className="hidden h-5 w-5 dark:block" />
            </button>
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="-mr-2 rounded-md p-2 text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink md:hidden"
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {isMenuOpen ? <HiOutlineXMark className="h-6 w-6" /> : <HiOutlineBars3 className="h-6 w-6" />}
          </button>
        </div>

        {/* 모바일 네비게이션 */}
        {isMenuOpen && (
          <nav className="border-t border-line py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded px-3 py-3 text-sm font-medium transition-colors hover:bg-paper-3 hover:text-ink ${
                    isActive(pathname, item.href) ? "text-ink" : "text-ink-2"
                  }`}
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
                    className="flex items-center gap-2 rounded px-3 py-3 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink disabled:opacity-50"
                  >
                    <HiOutlineArrowLeftOnRectangle className="h-5 w-5" />
                    로그아웃
                  </button>
                ) : (
                  <Link
                    href={loginHref}
                    className="flex items-center gap-2 rounded px-3 py-3 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
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
                className="mt-1 flex items-center gap-2 rounded px-3 py-3 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
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
