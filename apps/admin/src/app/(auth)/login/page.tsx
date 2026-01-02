"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";

const SESSION_START_KEY = "admin_session_start";
const LAST_ACTIVITY_KEY = "admin_last_activity";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setError(error.message || "이메일 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
      return;
    }

    // 새 세션 시작 - 타이머 초기화
    const now = Date.now().toString();
    localStorage.setItem(SESSION_START_KEY, now);
    localStorage.setItem(LAST_ACTIVITY_KEY, now);

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Noopdaa Blog
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            관리자 로그인
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label="이메일"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="비밀번호"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          30분간 활동이 없거나 8시간이 지나면 자동 로그아웃됩니다.
        </p>
      </div>
    </div>
  );
}
