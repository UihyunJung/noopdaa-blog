"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Input, LoadingSpinner } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";

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
      const res = await fetch("/api/auth/check")
        .then((r) => r.json())
        .catch(() => ({ isAdmin: false, profile: null }));
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
      const check = await fetch("/api/auth/check")
        .then((r) => r.json())
        .catch(() => ({ isAdmin: false }));

      if (!check.isAdmin) {
        await supabase.auth.signOut();
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
      await createClient().auth.signOut();
      toast.success("로그아웃했습니다.");
      window.location.href = "/";
    } catch (err) {
      console.error("로그아웃 오류:", err);
      toast.error("로그아웃에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-16">
      {status.kind === "checking" && (
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {status.kind === "admin" && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/50 p-6 text-center dark:border-primary-800 dark:bg-primary-900/20">
          <p className="text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {status.username}
            </span>
            (으)로 로그인되어 있습니다.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            이제 댓글이 관리자 이름으로 작성됩니다.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              홈으로
            </Link>
            <Button onClick={handleLogout} isLoading={isSubmitting}>
              로그아웃
            </Button>
          </div>
        </div>
      )}

      {status.kind === "guest" && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              관리자 로그인
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              댓글을 관리자 이름으로 작성하려면 로그인하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="이메일"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              type="password"
              label="비밀번호"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              로그인
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
