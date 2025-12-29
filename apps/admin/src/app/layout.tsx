import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Noopdaa Blog Admin",
  description: "블로그 관리자 페이지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  );
}
