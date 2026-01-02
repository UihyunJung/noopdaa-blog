"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UseIdleTimeoutOptions {
  idleTimeout?: number; // 비활성 타임아웃 (ms)
  sessionTimeout?: number; // 세션 최대 유지 시간 (ms)
  onIdle?: () => void;
  onSessionExpired?: () => void;
}

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30분
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8시간
const SESSION_START_KEY = "admin_session_start";
const LAST_ACTIVITY_KEY = "admin_last_activity";

export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
  const {
    idleTimeout = IDLE_TIMEOUT,
    sessionTimeout = SESSION_TIMEOUT,
    onIdle,
    onSessionExpired,
  } = options;

  const router = useRouter();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    router.push("/login");
    router.refresh();
  }, [router]);

  const handleIdle = useCallback(() => {
    if (onIdle) {
      onIdle();
    }
    logout();
  }, [logout, onIdle]);

  const handleSessionExpired = useCallback(() => {
    if (onSessionExpired) {
      onSessionExpired();
    }
    logout();
  }, [logout, onSessionExpired]);

  const resetIdleTimer = useCallback(() => {
    // 마지막 활동 시간 저장
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    // 기존 타이머 클리어
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // 새 타이머 설정
    idleTimerRef.current = setTimeout(handleIdle, idleTimeout);
  }, [idleTimeout, handleIdle]);

  const checkSessionExpiry = useCallback(() => {
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    if (sessionStart) {
      const elapsed = Date.now() - parseInt(sessionStart, 10);
      if (elapsed >= sessionTimeout) {
        handleSessionExpired();
        return;
      }
    }

    // 다른 탭에서 비활성으로 로그아웃됐는지 확인
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= idleTimeout) {
        handleIdle();
      }
    }
  }, [sessionTimeout, idleTimeout, handleSessionExpired, handleIdle]);

  useEffect(() => {
    // 세션 시작 시간 설정 (없으면)
    if (!localStorage.getItem(SESSION_START_KEY)) {
      localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }

    // 초기 활동 시간 설정
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    // 세션 만료 체크 시작
    checkSessionExpiry();

    // 주기적으로 세션 만료 체크 (1분마다)
    sessionCheckRef.current = setInterval(checkSessionExpiry, 60 * 1000);

    // 비활성 타이머 시작
    idleTimerRef.current = setTimeout(handleIdle, idleTimeout);

    // 활동 감지 이벤트들
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    // 쓰로틀링된 이벤트 핸들러 (1초에 최대 1번)
    let lastCall = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastCall >= 1000) {
        lastCall = now;
        resetIdleTimer();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // 다른 탭에서 로그아웃 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_START_KEY && e.newValue === null) {
        // 다른 탭에서 로그아웃함
        router.push("/login");
        router.refresh();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // 클린업
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, throttledReset);
      });
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [idleTimeout, resetIdleTimer, handleIdle, checkSessionExpiry, router]);

  return { resetIdleTimer, logout };
}
