"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, LoadingSpinner } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { fetchAuthCheck } from "@/lib/auth-client";

/**
 * 로그인 후 이동할 경로 검증.
 * 외부 도메인으로의 open redirect를 막기 위해 사이트 내부 경로만 허용한다.
 */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

// 화면 상태 — useEffect 안에서 setState를 여러 번 호출하지 않도록 단일 상태로 관리
type Status =
  | { kind: "checking" }
  | { kind: "guest" }
  | { kind: "admin"; username: string };

const fieldClass =
  "h-11 w-full rounded-md border bg-paper-2 px-3.5 text-[15px] text-ink transition-colors placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-0";
const inkButtonClass =
  "h-11 rounded-md bg-ink text-sm font-semibold text-paper hover:bg-ink hover:opacity-85 focus:ring-ink";

export default function LoginPage() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미 관리자로 로그인돼 있는지 확인
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchAuthCheck();
      if (cancelled) return;
      setStatus(
        res.isAdmin
          ? { kind: "admin", username: res.profile?.username || "관리자" }
          : { kind: "guest" }
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      // 세션 쿠키가 실제로 저장됐는지, 그리고 관리자 계정인지 서버에서 확인.
      // 쿠키 도메인 설정이 현재 호스트와 맞지 않으면 로그인 자체는 성공해도
      // 브라우저가 쿠키를 버려 아무 일도 일어나지 않는다. 그 경우를 여기서 잡아낸다.
      const check = await fetchAuthCheck(true);

      if (!check.isAdmin) {
        // scope: "local" — 이 브라우저의 로그인만 되돌린다 (다른 기기 세션 유지)
        await supabase.auth.signOut({ scope: "local" });
        setError(
          "관리자 계정이 아니거나 세션을 저장하지 못했습니다. 쿠키 설정을 확인해주세요."
        );
        return;
      }

      // 전체 페이지 이동으로 서버 컴포넌트에도 세션을 반영
      window.location.href = safeNextPath(
        new URLSearchParams(window.location.search).get("next")
      );
    } catch (err) {
      console.error("로그인 오류:", err);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // scope: "local" — 기본값 "global"은 admin 앱 세션까지 함께 폐기한다 (Header 참고)
      await createClient().auth.signOut({ scope: "local" });
      toast.success("로그아웃했습니다.");
      window.location.href = "/";
    } catch (err) {
      console.error("로그아웃 오류:", err);
      toast.error("로그아웃에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[400px] flex-col justify-center px-5 py-16">
      {status.kind === "checking" && (
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {status.kind === "admin" && (
        <div className="flex flex-col items-center gap-6 rounded-md border border-line bg-paper-2 px-7 py-8 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-base font-semibold text-paper">
            {status.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[15px] text-ink-2">
              <span className="font-semibold text-ink">{status.username}</span>
              (으)로 로그인되어 있습니다.
            </p>
            <p className="text-[13px] text-ink-3">
              이제 댓글이 관리자 이름으로 작성됩니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-ink px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-3"
            >
              홈으로
            </Link>
            <Button
              onClick={handleLogout}
              isLoading={isSubmitting}
              className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink hover:opacity-85 focus:ring-ink"
            >
              로그아웃
            </Button>
          </div>
        </div>
      )}

      {status.kind === "guest" && (
        <>
          <div className="mb-8 text-center">
            <h1 className="font-serif text-[28px] font-semibold tracking-tight text-ink">
              관리자 로그인
            </h1>
            <p className="mt-2.5 text-sm text-ink-2">
              댓글을 관리자 이름으로 작성하려면 로그인하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-ink-2">이메일</span>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className={`${fieldClass} ${error ? "border-red-700 dark:border-red-400" : "border-line"}`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-ink-2">비밀번호</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={`${fieldClass} ${error ? "border-red-700 dark:border-red-400" : "border-line"}`}
              />
            </label>

            {error && (
              <p className="-mt-1 text-[13px] text-red-700 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className={`mt-1 w-full ${inkButtonClass}`} isLoading={isSubmitting}>
              로그인
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
