"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 비활성 30분, 세션 최대 8시간 후 자동 로그아웃
  useIdleTimeout();

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
